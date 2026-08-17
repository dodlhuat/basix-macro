<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'since' => ['nullable', 'date'],
            'profile' => ['nullable', 'array'],
            'tables' => ['nullable', 'array'],
            'tables.food_items' => ['nullable', 'array'],
            'tables.recipes' => ['nullable', 'array'],
            'tables.recipe_ingredients' => ['nullable', 'array'],
            'tables.diary_entries' => ['nullable', 'array'],
            'tables.weight_entries' => ['nullable', 'array'],
            'tables.water_entries' => ['nullable', 'array'],
            'tables.body_fat_entries' => ['nullable', 'array'],
        ];
    }
}
