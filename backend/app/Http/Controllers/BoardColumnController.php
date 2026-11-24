<?php

namespace App\Http\Controllers;

use App\Models\BoardColumn;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BoardColumnController extends Controller
{
    // Visible to the project's manager and its members
    public function index(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $project->isOwnedBy($user) || $project->hasMember($user),
            403,
            'You do not have access to this project.'
        );

        return response()->json($project->boardColumns()->get());
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        abort_unless($project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('board_columns', 'name')->where('project_id', $project->id),
            ],
            'is_done' => ['sometimes', 'boolean'],
        ]);

        // New columns go at the end of the board
        $position = (BoardColumn::where('project_id', $project->id)->max('position') ?? 0) + 1;

        $column = $project->boardColumns()->create([
            'name' => $data['name'],
            'position' => $position,
            'is_done' => $data['is_done'] ?? false,
        ]);

        return response()->json($column, 201);
    }

    public function update(Request $request, BoardColumn $boardColumn): JsonResponse
    {
        $project = $boardColumn->project;
        abort_unless($project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        $data = $request->validate([
            'name' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('board_columns', 'name')
                    ->where('project_id', $project->id)
                    ->ignore($boardColumn->id),
            ],
            'is_done' => ['sometimes', 'boolean'],
        ]);

        // A project must always keep at least one done column
        if (array_key_exists('is_done', $data) && ! $data['is_done'] && $boardColumn->is_done
            && $this->doneColumnCount($project) === 1) {
            return response()->json(['message' => 'At least one column must be marked as done.'], 422);
        }

        $boardColumn->update($data);

        return response()->json($boardColumn);
    }

    public function destroy(Request $request, BoardColumn $boardColumn): JsonResponse
    {
        $project = $boardColumn->project;
        abort_unless($project->isOwnedBy($request->user()), 403, 'Only the project manager can do this.');

        // Only empty columns can be deleted, so no task loses its place on the board
        if ($boardColumn->tasks()->exists()) {
            return response()->json(['message' => 'Move or delete the tasks in this column first.'], 409);
        }

        if ($boardColumn->is_done && $this->doneColumnCount($project) === 1) {
            return response()->json(['message' => 'The last done column cannot be deleted.'], 409);
        }

        $boardColumn->delete();

        return response()->json(['message' => 'Column deleted.']);
    }

    private function doneColumnCount(Project $project): int
    {
        return BoardColumn::where('project_id', $project->id)->where('is_done', true)->count();
    }
}