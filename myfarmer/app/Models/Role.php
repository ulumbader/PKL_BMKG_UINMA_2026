<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public $timestamps = false;

    protected $table = 'roles';

    protected $fillable = [
        'nama_role',
        'deskripsi',
    ];

    /**
     * Users yang memiliki role ini.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
