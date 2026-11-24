<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name', 'description', 'start_date', 'end_date', 'status', 'manager_id',
    ];

    protected function casts(): array
    {
        return [
            // Turns the database date into a Carbon object, so we can compare dates
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    // The manager who owns the project
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // The employees working on the project, through the project_user pivot table
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')->withTimestamps();
    }

    // All tasks in this project
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    // The columns of the board, always in display order
    public function boardColumns(): HasMany
    {
        return $this->hasMany(BoardColumn::class)->orderBy('position');
    }

    // Every new project starts with the three default columns
    protected static function booted(): void
    {
        static::created(function (Project $project) {
            $project->boardColumns()->createMany([
                ['name' => 'À faire', 'position' => 1, 'is_done' => false],
                ['name' => 'En cours', 'position' => 2, 'is_done' => false],
                ['name' => 'Terminé', 'position' => 3, 'is_done' => true],
            ]);
        });
    }

    public function isOwnedBy(User $user): bool
    {
        return $user->id === $this->manager_id;
    }

    public function hasMember(User $user): bool
    {
        return $this->members()->whereKey($user->id)->exists();
    }
}