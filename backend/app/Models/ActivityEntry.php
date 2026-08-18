<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityEntry extends Model
{
    use HasUuid;

    protected $fillable = [
        'id',
        'user_id',
        'date',
        'name',
        'calories_burned',
        'duration_min',
        'client_updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'client_updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
