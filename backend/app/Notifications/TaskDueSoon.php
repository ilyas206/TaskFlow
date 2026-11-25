<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Notifications\Notification;

class TaskDueSoon extends Notification
{
    public function __construct(private Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $overdue = $this->task->due_date->lt(today());

        $message = $overdue
            ? "« {$this->task->title} » est en retard."
            : "« {$this->task->title} » arrive à échéance le {$this->task->due_date->format('d/m/Y')}.";

        return [
            'kind' => 'due_soon',
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'due_date' => $this->task->due_date->toDateString(),
            'title' => $overdue ? 'Tâche en retard' : 'Échéance proche',
            'message' => $message,
        ];
    }
}