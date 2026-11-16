<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public route: anyone can try to log in
Route::post('/login', [AuthController::class, 'login']);

// Any logged-in user (manager or employee)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Read access: the controller decides which projects each user can see
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);

    // "my-tasks" must come before "tasks/{task}". Otherwise Laravel reads "my-tasks" as an ID.
    Route::get('/tasks/my-tasks', [TaskController::class, 'myTasks']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);

    // Manager-only routes
    Route::middleware('manager')->group(function () {
        // Only the four actions from the spec, not the extra create/edit form routes
        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

        Route::post('/projects/{project}/members', [ProjectController::class, 'addMember']);
        Route::delete('/projects/{project}/members/{userId}', [ProjectController::class, 'removeMember']);

        Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    });
});