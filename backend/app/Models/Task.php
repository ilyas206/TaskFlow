<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'title', 'description', 'board_column_id',
        'priority', 'start_date', 'due_date',
    ];

    // These fields are added to JSON responses, so the frontend gets them without extra logic
    protected $appends = ['is_overdue'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'board_column_id' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // The column that shows where the task is on the board
    public function boardColumn(): BelongsTo
    {
        return $this->belongsTo(boardColumn::class);
    }

    // Several employees can work on the same task
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user')->withTimestamps();
    }

    public function isAssignedTo(User $user): bool
    {
        return $this->assignees()->whereKey($user->id)->exists();
    }

    // Overdue means: the due date has passed, and the task is not in a done column
    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date !== null
            && ! $this->boardColumn?->is_done
            && $this->due_date->copy()->endOfDay()->isPast();
    }
}