<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BodyFatEntry extends Model
{
    use HasUuid;

    protected $fillable = [
        'id',
        'user_id',
        'date',
        'gender',
        'height_cm',
        'neck_cm',
        'waist_cm',
        'hip_cm',
        'body_fat_percent',
        'category',
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
