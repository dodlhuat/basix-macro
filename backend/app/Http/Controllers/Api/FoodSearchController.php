<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FoodSearchController extends Controller
{
    /**
     * @return array{hits: array<int, array<string, mixed>>}
     */
    public function index(Request $request): array
    {
        $query = $request->string('q')->trim()->toString();

        if ($query === '') {
            return ['hits' => []];
        }

        $params = array_filter([
            'q' => $query,
            'page_size' => 10,
            'langs' => $request->string('langs')->toString() ?: null,
            'fields' => 'code,product_name,brands,serving_quantity,serving_size,nutriments',
        ], fn ($value) => $value !== null);

        $response = Http::timeout(5)->get('https://search.openfoodfacts.org/search', $params);

        if ($response->failed()) {
            return ['hits' => []];
        }

        return ['hits' => $response->json('hits') ?? []];
    }
}
