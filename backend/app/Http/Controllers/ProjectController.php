<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Project::with('manager:id,name')->orderBy('start_date');

        if ($user->isManager()) {
            // Managers see the projects they own
            $query->where('manager_id', $user->id);
        } else {
            // Employees see the projects they are members of
            $query->whereHas('members', fn ($q) => $q->where('users.id', $user->id));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', Rule::in(['planned', 'active', 'completed', 'archived'])],
        ]);

        // The logged-in manager becomes the owner, so the client never sends manager_id
        $data['manager_id'] = $request->user()->id;

        $project = Project::create($data);

        return response()->json($project, 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorizeView($request->user(), $project);

        return response()->json(
            $project->load(['manager:id,name', 'members:id,name,email,role'])
        );
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request->user(), $project);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', Rule::in(['planned', 'active', 'completed', 'archived'])],
        ]);

        // Check the dates together, because the update may change only one of them
        $project->fill($data);
        if ($project->end_date->lt($project->start_date)) {
            return response()->json([
                'message' => 'The end date cannot be before the start date.',
            ], 422);
        }

        $project->save();

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request->user(), $project);

        // Membership rows are deleted automatically 
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request->user(), $project);

        $data = $request->validate([
            // Only employees can be added to a project
            'user_id' => ['required', Rule::exists('users', 'id')->where('role', 'employee')],
        ]);

        // syncWithoutDetaching adds the employee only if they are not already a member
        $project->members()->syncWithoutDetaching([$data['user_id']]);

        return response()->json($project->load('members:id,name,email,role'));
    }

    public function removeMember(Request $request, Project $project, int $userId): JsonResponse
    {
        $this->authorizeOwner($request->user(), $project);

        $project->members()->detach($userId);

        // Their tasks in this project become unassigned, so no one keeps work from a former member
        $project->tasks()->where('assigned_to', $userId)->update(['assigned_to' => null]);

        return response()->json($project->load('members:id,name,email,role'));
    }

    // A manager sees their own projects, and an employee sees projects they belong to
    private function authorizeView(User $user, Project $project): void
    {
        $isOwner = $user->id === $project->manager_id;
        $isMember = $project->members()->whereKey($user->id)->exists();

        abort_unless($isOwner || $isMember, 403, 'You do not have access to this project.');
    }

    // Only the manager who owns the project can change it
    private function authorizeOwner(User $user, Project $project): void
    {
        abort_unless($user->id === $project->manager_id, 403, 'Only the project manager can do this.');
    }
}