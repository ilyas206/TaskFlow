<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['planned', 'active', 'completed', 'archived'])
                  ->default('planned');

            // The manager who owns the project. A manager with projects cannot be deleted.
            $table->foreignId('manager_id')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->timestamps();
        });

        // The end date cannot be before the start date.
        DB::statement('ALTER TABLE projects ADD CONSTRAINT projects_dates_check
                       CHECK (end_date >= start_date)');
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};