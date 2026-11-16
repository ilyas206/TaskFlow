<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    // HasApiTokens lets the user create API tokens
    use HasApiTokens, HasFactory, Notifiable;

    // Fields that can be set in bulk (for example, when the manager creates an employee)
    protected $fillable = ['name', 'email', 'password', 'role'];

    // Never send these fields in JSON responses
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            // Hashes the password automatically when it is saved
            'password' => 'hashed',
        ];
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }
}