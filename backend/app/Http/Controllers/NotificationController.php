<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskDueSoon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Create due-soon notifications first, so the list is up to date
        $this->createDueSoonNotifications($user);

        $items = $user->notifications()->latest()->limit(30)->get();

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $items->map(fn ($n) => [
                'id' => $n->id,
                'read' => $n->read_at !== null,
                'created_at' => $n->created_at?->toISOString(),
                ...$n->data,
            ])->values(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        // Looking only in the user's own notifications means others get 404
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All marked as read.']);
    }

    // Tasks due within 48 hours (or already late) that are not done, where the user is an
    // assignee or the project manager. Each user gets one warning per task and due date.
    private function createDueSoonNotifications(User $user): void
    {
        // Query 1: the tasks that may need a warning, with their project and assignees
        $tasks = Task::with(['project:id,name,manager_id', 'assignees:id,name'])
            ->where(function ($query) use ($user) {
                $query->whereHas('assignees', fn ($q) => $q->whereKey($user->id))
                    ->orWhereHas('project', fn ($q) => $q->where('manager_id', $user->id));
            })
            ->whereHas('boardColumn', fn ($c) => $c->where('is_done', false))
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', now()->addDays(2)->toDateString())
            ->get();

        if ($tasks->isEmpty()) {
            return;
        }

        // Query 2: every due-soon warning this user already has for these tasks.
        // The result is a list of "task_id|due_date" keys, so no query runs inside the loop.
        $taskIds = $tasks->pluck('id')->map(fn ($id) => (string) $id)->all();

        $sentKeys = $user->notifications()
            ->where('type', TaskDueSoon::class)
            ->whereIn('data->task_id', $taskIds)
            ->get()
            ->map(fn ($n) => ($n->data['task_id'] ?? '').'|'.($n->data['due_date'] ?? ''))
            ->all();

        // No queries here except the inserts for the warnings that are actually new
        foreach ($tasks as $task) {
            $key = $task->id.'|'.$task->due_date->toDateString();

            if (! in_array($key, $sentKeys, true)) {
                $user->notify(new TaskDueSoon($task));
            }
        }
    }
}