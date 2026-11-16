<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'title', 'description', 'assigned_to',
        'priority', 'status', 'start_date', 'due_date',
    ];

    // These fields are added to JSON responses, so the frontend gets them without extra logic
    protected $appends = ['is_overdue'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            // Keeps assigned_to a PHP integer, so comparisons with user IDs are reliable
            'assigned_to' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // The employee responsible for the task. The column is named assigned_to, not user_id.
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // A task is overdue when its due date has passed and it is not done yet
    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date !== null
            && $this->status !== 'done'
            && $this->due_date->copy()->endOfDay()->isPast();
    }
}