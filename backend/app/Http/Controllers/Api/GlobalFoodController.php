<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GlobalFoodItemResource;
use App\Models\GlobalFoodItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GlobalFoodController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = GlobalFoodItem::query()->where('status', 'approved');

        if ($barcode = $request->string('barcode')->trim()->toString()) {
            $query->where('barcode', $barcode);
            $results = $query->limit(1)->get();
        } else {
            if ($search = $request->string('q')->trim()->toString()) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            }

            $results = $query->orderBy('name')->limit(20)->get();
        }

        return GlobalFoodItemResource::collection($results);
    }
}
