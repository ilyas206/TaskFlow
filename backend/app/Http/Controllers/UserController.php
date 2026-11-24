<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['manager', 'employee'])],
        ]);

        // Only the administrator can create manager accounts
        if ($data['role'] === 'manager' && ! $request->user()->is_admin) {
            return $this->forbidden('Only the administrator can create manager accounts.');
        }

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();

        if (! $this->canEdit($actor, $user)) {
            return $this->forbidden('You cannot modify this account.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in(['manager', 'employee'])],
        ]);

        if (isset($data['role']) && $data['role'] !== $user->role) {
            if ($user->id === $actor->id) {
                return response()->json(['message' => 'You cannot change your own role.'], 422);
            }

            // Only the administrator can promote an employee to manager
            if ($data['role'] === 'manager' && ! $actor->is_admin) {
                return $this->forbidden('Only the administrator can promote users to manager.');
            }

            // A manager who still owns projects cannot become an employee
            if ($user->role === 'manager' && Project::where('manager_id', $user->id)->exists()) {
                return response()->json([
                    'message' => 'This user still manages projects. Reassign or delete them first.',
                ], 409);
            }
        }

        // is_admin is not in the validated data, so it cannot be changed here
        $user->update($data);

        return response()->json($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();

        if ($user->id === $actor->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if (! $this->canDelete($actor, $user)) {
            return $this->forbidden('You cannot delete this account.');
        }

        try {
            $user->delete();
        } catch (QueryException $e) {
            // PostgreSQL error 23503 = foreign key violation (the user still manages projects)
            if ($e->getCode() === '23503') {
                return response()->json([
                    'message' => 'This user still manages projects. Reassign or delete them first.',
                ], 409);
            }
            throw $e;
        }

        return response()->json(['message' => 'User deleted.']);
    }

    // Own profile: always allowed (role changes are checked separately)
    // Admin: never editable by others
    // Employee: any manager can edit
    // Regular manager: only the administrator can edit
    private function canEdit(User $actor, User $target): bool
    {
        if ($target->id === $actor->id) {
            return true;
        }

        if ($target->is_admin) {
            return false;
        }

        if ($target->role === 'employee') {
            return true;
        }

        return $actor->is_admin;
    }

    // Same rules as editing, except that an account can always be deleted by the admin
    // when it is another manager. Own account is checked before this method runs.
    private function canDelete(User $actor, User $target): bool
    {
        if ($target->is_admin) {
            return false;
        }

        if ($target->role === 'employee') {
            return true;
        }

        return $actor->is_admin;
    }

    private function forbidden(string $message): JsonResponse
    {
        return response()->json(['message' => $message], 403);
    }
}