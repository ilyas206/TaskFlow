<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function manager(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::where('manager_id', $user->id)
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($q) => $q->whereHas(
                    'boardColumn',
                    fn ($c) => $c->where('is_done', true)
                ),
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'projects' => [
                'total' => $projects->count(),
                'active' => $projects->where('status', 'active')->count(),
                'list' => $projects->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'status' => $p->status,
                    'progress' => $this->percent($p->done_tasks_count, $p->tasks_count),
                ])->values(),
            ],
            'tasks' => $this->taskSummary(
                Task::whereIn('project_id', $projects->pluck('id'))
            ),
        ]);
    }

    public function employee(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'projects' => Project::whereHas('members', fn ($q) => $q->where('users.id', $user->id))->count(),
            'tasks' => $this->taskSummary(
                Task::whereHas('assignees', fn ($q) => $q->whereKey($user->id))
            ),
        ]);
    }

    public function project(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $project->isOwnedBy($user) || $project->hasMember($user),
            403,
            'You do not have access to this project.'
        );

        $tasks = Task::where('project_id', $project->id);

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
            ],
            'members' => $project->members()->count(),
            'tasks' => $this->taskSummary($tasks),
            // Task count per column, for the board overview
            'columns' => $this->columnBreakdown($project, $tasks),
        ]);
    }

    // One query for all totals. Each FILTER counts only the rows that match its condition.
    private function taskSummary(Builder $tasks): array
    {
        $done = 'SELECT id FROM board_columns WHERE is_done';
        $firstColumn = 'SELECT id FROM board_columns WHERE position = 1 AND NOT is_done';

        $row = (clone $tasks)->selectRaw(
            "COUNT(*) AS total,
             COUNT(*) FILTER (WHERE tasks.board_column_id IN ({$done})) AS done,
             COUNT(*) FILTER (WHERE tasks.board_column_id IN ({$firstColumn})) AS not_started,
             COUNT(*) FILTER (WHERE tasks.board_column_id NOT IN ({$done})
                               AND tasks.board_column_id NOT IN ({$firstColumn})) AS in_progress,
             COUNT(*) FILTER (WHERE tasks.due_date < ?
                               AND tasks.board_column_id NOT IN ({$done})) AS overdue",
            [today()->toDateString()]
        )->first();

        $total = (int) $row->total;
        $done = (int) $row->done;

        return [
            'total' => $total,
            'not_started' => (int) $row->not_started,
            'in_progress' => (int) $row->in_progress,
            'done' => $done,
            'overdue' => (int) $row->overdue,
            'progress' => $this->percent($done, $total),
        ];
    }

    private function columnBreakdown(Project $project, Builder $tasks): array
    {
        $counts = (clone $tasks)
            ->selectRaw('board_column_id, COUNT(*) AS count')
            ->groupBy('board_column_id')
            ->pluck('count', 'board_column_id');

        return $project->boardColumns->map(fn ($column) => [
            'id' => $column->id,
            'name' => $column->name,
            'is_done' => $column->is_done,
            'count' => (int) ($counts[$column->id] ?? 0),
        ])->values()->all();
    }

    private function percent(int $done, int $total): int
    {
        return $total === 0 ? 0 : (int) round($done / $total * 100);
    }
}