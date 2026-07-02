<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncRequest;
use App\Models\User;
use App\Services\SyncService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    public function __construct(private readonly SyncService $syncService) {}

    public function sync(SyncRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $userId = $user->id;
        $since = $request->filled('since') ? Carbon::parse($request->validated('since')) : null;

        $pushResults = [];
        $changes = [];

        $profilePayload = $request->validated('profile');
        if (is_array($profilePayload)) {
            $pushResults['profile'] = $this->syncService->pushProfile($userId, $profilePayload);
        }
        $changes['profile'] = $this->syncService->pullProfile($userId, $since);

        foreach ($this->syncService->tables() as $table) {
            $rows = $request->validated("tables.{$table->key}") ?? [];
            $pushResults[$table->key] = $this->syncService->pushRows($table, $userId, $rows);
            $changes[$table->key] = $this->syncService->pullRows($table, $userId, $since);

            if ($table->key === 'food_items') {
                $this->syncService->submitManualFoodItemsToGlobalDatabase($userId, $rows, $pushResults[$table->key]);
            }
        }

        return response()->json([
            'server_time' => now()->toISOString(),
            'push_results' => $pushResults,
            'changes' => $changes,
        ]);
    }
}
