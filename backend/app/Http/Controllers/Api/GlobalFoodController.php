<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GlobalFoodItemResource;
use App\Models\GlobalFoodItem;
use Illuminate\Http\Request;

class GlobalFoodController extends Controller
{
    public function index(Request $request)
    {
        $query = GlobalFoodItem::query()->where('status', 'approved');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        $results = $query->orderBy('name')->limit(20)->get();

        return GlobalFoodItemResource::collection($results);
    }
}
