<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FoodSubmissionUpdateRequest;
use App\Http\Resources\GlobalFoodItemResource;
use App\Models\GlobalFoodItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FoodSubmissionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = GlobalFoodItem::query();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return GlobalFoodItemResource::collection($query->orderBy('created_at')->get());
    }

    public function update(FoodSubmissionUpdateRequest $request, GlobalFoodItem $foodSubmission): GlobalFoodItemResource
    {
        $data = $request->validated();

        if (isset($data['status']) && $data['status'] !== 'pending') {
            /** @var User $user */
            $user = $request->user();
            $data['reviewed_by'] = $user->id;
            $data['reviewed_at'] = now();
        }

        $foodSubmission->update($data);

        return new GlobalFoodItemResource($foodSubmission);
    }

    public function destroy(GlobalFoodItem $foodSubmission): Response
    {
        $foodSubmission->delete();

        return response()->noContent();
    }
}
