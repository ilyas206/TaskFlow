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

        // The manager gets the assignees' names, so he knows whom to follow up with
        $isManager = $notifiable->id === $this->task->project->manager_id;
        $assignees = $this->task->assignees->pluck('name')->implode(', ');

        $message = $overdue
            ? "« {$this->task->title} » est en retard (échéance : {$this->task->due_date->format('d/m/Y')})."
            : "« {$this->task->title} » arrive à échéance le {$this->task->due_date->format('d/m/Y')}.";

        if ($isManager && $assignees !== '') {
            $message .= " Assignée à : {$assignees}.";
        }

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