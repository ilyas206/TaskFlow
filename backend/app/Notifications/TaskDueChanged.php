<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Notifications\Notification;

class TaskDueChanged extends Notification
{
    public function __construct(private Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        // A null due date means the deadline was removed
        $message = $this->task->due_date
            ? "L'échéance de « {$this->task->title} » est maintenant le {$this->task->due_date->format('d/m/Y')}."
            : "La date limite de « {$this->task->title} » a été retirée.";

        return [
            'kind' => 'due_changed',
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'title' => 'Échéance modifiée',
            'message' => $message,
        ];
    }
}