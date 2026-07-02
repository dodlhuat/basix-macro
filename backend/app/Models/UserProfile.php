<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasUuid;

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'age',
        'gender',
        'height_cm',
        'weight_kg',
        'activity_level',
        'goal',
        'calorie_goal',
        'protein_goal_g',
        'carbs_goal_g',
        'fat_goal_g',
        'unit_system',
        'water_goal_ml',
        'dark_mode',
        'adaptive_calories_enabled',
        'adaptive_calories_last_adjusted_at',
        'adaptive_calories_last_delta_kcal',
        'locale',
        'client_updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'dark_mode' => 'boolean',
            'adaptive_calories_enabled' => 'boolean',
            'adaptive_calories_last_adjusted_at' => 'datetime',
            'client_updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
