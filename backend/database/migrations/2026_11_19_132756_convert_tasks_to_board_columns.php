<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // 1. Give every existing project the three default columns
        foreach (DB::table('projects')->pluck('id') as $projectId) {
            DB::table('board_columns')->insert([
                ['project_id' => $projectId, 'name' => 'À faire', 'position' => 1, 'is_done' => false, 'created_at' => $now, 'updated_at' => $now],
                ['project_id' => $projectId, 'name' => 'En cours', 'position' => 2, 'is_done' => false, 'created_at' => $now, 'updated_at' => $now],
                ['project_id' => $projectId, 'name' => 'Terminé', 'position' => 3, 'is_done' => true, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        // 2. Add the new column to tasks, nullable for now so existing rows are allowed
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('board_column_id')
                  ->nullable()
                  ->constrained('board_columns')
                  ->restrictOnDelete();
        });

        // 3. Move each task to the column that matches its old status
        $statusToPosition = ['todo' => 1, 'in_progress' => 2, 'done' => 3];
        foreach ($statusToPosition as $status => $position) {
            DB::table('tasks')
                ->where('status', $status)
                ->update([
                    'board_column_id' => DB::raw(
                        "(SELECT bc.id FROM board_columns bc
                          WHERE bc.project_id = tasks.project_id AND bc.position = {$position})"
                    ),
                ]);
        }

        // 4. Copy the old single assignee into the new pivot table
        DB::statement('INSERT INTO task_user (task_id, user_id, created_at, updated_at)
                       SELECT id, assigned_to, NOW(), NOW() FROM tasks
                       WHERE assigned_to IS NOT NULL');

        // 5. Remove the old columns, and make the new one required
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['status', 'assigned_to']);
        });

        DB::statement('ALTER TABLE tasks ALTER COLUMN board_column_id SET NOT NULL');
    }

    public function down(): void
    {
        // Put back the old columns
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['todo', 'in_progress', 'done'])->default('todo');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
        });

        // Map each column back to a status: done columns become done, the first column becomes todo
        DB::statement("UPDATE tasks SET status = CASE
                          WHEN bc.is_done THEN 'done'
                          WHEN bc.position = 1 THEN 'todo'
                          ELSE 'in_progress' END
                       FROM board_columns bc
                       WHERE bc.id = tasks.board_column_id");

        // Keep one assignee per task, because the old column allowed only one
        DB::statement('UPDATE tasks SET assigned_to = tu.user_id
                       FROM (SELECT DISTINCT ON (task_id) task_id, user_id
                             FROM task_user ORDER BY task_id, user_id) tu
                       WHERE tu.task_id = tasks.id');

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('board_column_id');
        });
    }
};