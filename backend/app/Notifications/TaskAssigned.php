<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification
{
    public function __construct(private Task $task) {}

    // Store the notification in the database, so the bell can list it later
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    // The data saved in the notifications table as JSON
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => 'assigned',
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'title' => 'Nouvelle tâche assignée',
            'message' => "« {$this->task->title} » vous a été assignée dans {$this->task->project->name}.",
        ];
    }
}