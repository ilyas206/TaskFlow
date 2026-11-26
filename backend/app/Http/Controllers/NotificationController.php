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

    // Tasks due within 48 hours (or already late) that are not done.
    // Each task notifies a user once, so reloading the list does not create duplicates.
    private function createDueSoonNotifications(User $user): void
    {
        $tasks = Task::with(['project:id,name,manager_id', 'assignees:id,name'])
            ->where(function ($query) use ($user) {
                // Tasks where the user is an assignee...
                $query->whereHas('assignees', fn ($q) => $q->whereKey($user->id))
                    // ...or tasks in a project the user manages
                    ->orWhereHas('project', fn ($q) => $q->where('manager_id', $user->id));
            })
            ->whereHas('boardColumn', fn ($c) => $c->where('is_done', false))
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', now()->addDays(2)->toDateString())
            ->get();

        foreach ($tasks as $task) {
            $alreadySent = $user->notifications()
                ->where('type', TaskDueSoon::class)
                // The JSON value is compared as text, so cast the ID to a string
                ->where('data->task_id', (string) $task->id)
                ->where('data->due_date', $task->due_date->toDateString())
                ->exists();

            if (! $alreadySent) {
                $user->notify(new TaskDueSoon($task));
            }
        }
    }
}