<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FoodSubmissionUpdateRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:255'],
            'barcode' => ['sometimes', 'nullable', 'string', 'max:64'],
            'calories_per_100g' => ['sometimes', 'numeric', 'min:0'],
            'protein_per_100g' => ['sometimes', 'numeric', 'min:0'],
            'carbs_per_100g' => ['sometimes', 'numeric', 'min:0'],
            'fat_per_100g' => ['sometimes', 'numeric', 'min:0'],
            'fiber_per_100g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sugar_per_100g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:pending,approved,rejected'],
            'rejection_reason' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
