<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $project->isOwnedBy($user) || $project->hasMember($user),
            403,
            'You do not have access to this project.'
        );

        $tasks = $project->tasks()
            ->with(['assignees:id,name,email', 'boardColumn:id,name,position,is_done'])
            ->orderBy('due_date')
            ->get();

        return response()->json($tasks);
    }

    // Tasks where the logged-in user is one of the assignees
    public function myTasks(Request $request): JsonResponse
    {
        $tasks = Task::with([
                'project:id,name',
                'boardColumn:id,name,position,is_done',
                'assignees:id,name,email',
            ])
            ->whereHas('assignees', fn ($q) => $q->whereKey($request->user()->id))
            ->orderBy('due_date')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        abort_unless($project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate($this->rules($project, creating: true));

        $assigneeIds = array_unique($data['assignee_ids'] ?? []);
        unset($data['assignee_ids']);

        // Without a chosen column, the task starts in the first column of the board
        $data['board_column_id'] ??= $project->boardColumns()->value('id');
        if ($data['board_column_id'] === null) {
            return response()->json(['message' => 'This project has no columns.'], 422);
        }

        $data['project_id'] = $project->id;
        $task = new Task($data);
        $this->ensureValidDates($task);

        DB::transaction(function () use ($task, $assigneeIds) {
            $task->save();
            $task->assignees()->sync($assigneeIds);
        });

        return response()->json($this->withRelations($task), 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $task->project->isOwnedBy($user) || $task->isAssignedTo($user),
            403,
            'You do not have access to this task.'
        );

        return response()->json($this->withRelations($task->load('project:id,name')));
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        abort_unless($task->project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate($this->rules($task->project, creating: false));

        // Only sync assignees when the request includes the field
        $assigneeIds = array_key_exists('assignee_ids', $data)
            ? array_unique($data['assignee_ids'] ?? [])
            : null;
        unset($data['assignee_ids']);

        $task->fill($data);
        $this->ensureValidDates($task);

        DB::transaction(function () use ($task, $assigneeIds) {
            $task->save();
            if ($assigneeIds !== null) {
                $task->assignees()->sync($assigneeIds);
            }
        });

        return response()->json($this->withRelations($task));
    }

    // Moving a task to another column. Managers and assignees can do this.
    public function move(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $task->project->isOwnedBy($user) || $task->isAssignedTo($user),
            403,
            'You cannot move this task.'
        );

        $data = $request->validate([
            'board_column_id' => [
                'required',
                Rule::exists('board_columns', 'id')->where('project_id', $task->project_id),
            ],
        ]);

        $task->update($data);

        return response()->json($this->withRelations($task));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        abort_unless($task->project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    // Validation shared by create and update.
    // Create requires a title, update only validates the fields it receives.
    private function rules(Project $project, bool $creating): array
    {
        return [
            'title' => array_merge($creating ? ['required'] : ['sometimes', 'required'], ['string', 'max:255']),
            'description' => ['nullable', 'string'],
            'board_column_id' => array_merge(
                $creating ? ['nullable'] : ['sometimes', 'required'],
                [Rule::exists('board_columns', 'id')->where('project_id', $project->id)]
            ),
            // Every assignee must be a current member of the project
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => [
                'integer',
                Rule::exists('project_user', 'user_id')->where('project_id', $project->id),
            ],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    private function withRelations(Task $task): Task
    {
        return $task->load([
            'assignees:id,name,email',
            'boardColumn:id,name,position,is_done',
        ]);
    }

    private function ensureValidDates(Task $task): void
    {
        if ($task->start_date && $task->due_date && $task->due_date->lt($task->start_date)) {
            abort(422, 'The due date cannot be before the start date.');
        }
    }
}