<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiaryEntry extends Model
{
    use HasUuid;

    protected $fillable = [
        'id',
        'user_id',
        'date',
        'meal_type',
        'food_item_id',
        'recipe_id',
        'amount_g',
        'servings',
        'calories_total',
        'protein_total_g',
        'carbs_total_g',
        'fat_total_g',
        'logged_at',
        'client_updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'logged_at' => 'datetime',
            'client_updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function foodItem(): BelongsTo
    {
        return $this->belongsTo(FoodItem::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
