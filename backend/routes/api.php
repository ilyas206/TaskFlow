<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardColumnController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Read access: the controllers decide what each user can see
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/projects/{project}/columns', [BoardColumnController::class, 'index']);
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);

    // "my-tasks" must come before "tasks/{task}"
    Route::get('/tasks/my-tasks', [TaskController::class, 'myTasks']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}/move', [TaskController::class, 'move']);

    Route::get('/dashboard/employee', [DashboardController::class, 'employee']);
    Route::get('/dashboard/projects/{project}', [DashboardController::class, 'project']);

    // Manager-only routes
    Route::middleware('manager')->group(function () {
        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::get('/dashboard/manager', [DashboardController::class, 'manager']);

        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

        Route::post('/projects/{project}/members', [ProjectController::class, 'addMember']);
        Route::delete('/projects/{project}/members/{userId}', [ProjectController::class, 'removeMember']);

        Route::post('/projects/{project}/columns', [BoardColumnController::class, 'store']);
        Route::put('/columns/{boardColumn}', [BoardColumnController::class, 'update']);
        Route::delete('/columns/{boardColumn}', [BoardColumnController::class, 'destroy']);

        Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    });
});