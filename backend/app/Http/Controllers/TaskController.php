<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    // All tasks of one project: visible to its manager and its members
    public function index(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $project->isOwnedBy($user) || $project->hasMember($user),
            403,
            'You do not have access to this project.'
        );

        return response()->json(
            $project->tasks()->with('assignee:id,name,email')->orderBy('due_date')->get()
        );
    }

    // The logged-in employee's own tasks, across all projects
    public function myTasks(Request $request): JsonResponse
    {
        $tasks = Task::with('project:id,name')
            ->where('assigned_to', $request->user()->id)
            ->orderBy('due_date')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        abort_unless($project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            // The assignee must be a current member of this project
            'assigned_to' => ['nullable', Rule::exists('project_user', 'user_id')
                ->where('project_id', $project->id)],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'done'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task = new Task($data);
        $task->project_id = $project->id;

        $this->ensureValidDates($task);
        $task->save();

        return response()->json($task->load('assignee:id,name,email'), 201);
    }

    // One task: visible to the project's manager and to its assignee
    public function show(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $task->project->isOwnedBy($user) || $task->assigned_to === $user->id,
            403,
            'You do not have access to this task.'
        );

        return response()->json($task->load(['project:id,name', 'assignee:id,name,email']));
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        abort_unless($task->project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', Rule::exists('project_user', 'user_id')
                ->where('project_id', $task->project_id)],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'done'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task->fill($data);
        $this->ensureValidDates($task);
        $task->save();

        return response()->json($task->load('assignee:id,name,email'));
    }

    // Employees use this route to move their task through the Kanban columns
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $task->project->isOwnedBy($user) || $task->assigned_to === $user->id,
            403,
            'You cannot change this task.'
        );

        $data = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'done'])],
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        abort_unless($task->project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    // Shared date rule for create and update
    private function ensureValidDates(Task $task): void
    {
        if ($task->start_date && $task->due_date && $task->due_date->lt($task->start_date)) {
            abort(422, 'The due date cannot be before the start date.');
        }
    }
}