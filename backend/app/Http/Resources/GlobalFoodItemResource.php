<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GlobalFoodItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'barcode' => $this->barcode,
            'calories_per_100g' => $this->calories_per_100g,
            'protein_per_100g' => $this->protein_per_100g,
            'carbs_per_100g' => $this->carbs_per_100g,
            'fat_per_100g' => $this->fat_per_100g,
            'fiber_per_100g' => $this->fiber_per_100g,
            'sugar_per_100g' => $this->sugar_per_100g,
            'status' => $this->status,
            'submitted_by' => $this->submitted_by,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
