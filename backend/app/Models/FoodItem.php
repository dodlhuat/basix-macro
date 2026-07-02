<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FoodItem extends Model
{
    use HasUuid;

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'brand',
        'barcode',
        'calories_per_100g',
        'protein_per_100g',
        'carbs_per_100g',
        'fat_per_100g',
        'fiber_per_100g',
        'sugar_per_100g',
        'source',
        'is_favorite',
        'last_used_at',
        'client_updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_favorite' => 'boolean',
            'last_used_at' => 'datetime',
            'client_updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
