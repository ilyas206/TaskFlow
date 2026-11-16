<?php

namespace App\Http\Controllers;

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

        // The 'hashed' cast in the User model encrypts the password automatically
        $user = User::create($data);

        // 201 means "created"
        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        // 'sometimes' means a field is validated only if it is sent,
        // so the manager can update a single field
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'email', 'max:255',
                // Ignore this user's own email, so saving it unchanged is not a "duplicate"
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in(['manager', 'employee'])],
        ]);

        $user->update($data);

        return response()->json($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        // A manager should not delete the account they are logged in with
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        try {
            $user->delete();
        } catch (QueryException $e) {
            // PostgreSQL error 23503 = foreign key violation.
            // This happens when the user still manages projects (restrictOnDelete).
            if ($e->getCode() === '23503') {
                return response()->json([
                    'message' => 'This user still manages projects. Reassign or delete them first.',
                ], 409);
            }
            throw $e;
        }

        return response()->json(['message' => 'User deleted.']);
    }
}