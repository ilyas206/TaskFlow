<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')
                  ->constrained('projects')
                  ->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();

            // Nullable: a task can exist without an assignee.
            // If the assigned employee is deleted, the task stays and becomes unassigned.
            $table->foreignId('assigned_to')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['todo', 'in_progress', 'done'])->default('todo');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();

            // Indexes speed up the most common queries: "my tasks" and the Kanban filters.
            $table->index('assigned_to');
            $table->index('status');
        });

        // If both dates are set, the due date cannot be before the start date.
        DB::statement('ALTER TABLE tasks ADD CONSTRAINT tasks_dates_check
                       CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};