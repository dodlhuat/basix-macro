<?php

namespace App\Support\Sync;

use Illuminate\Database\Eloquent\Model;

final class SyncableTable
{
    /**
     * @param  class-string<Model>  $modelClass
     * @param  string[]  $fillableFields  Domain fields the client is allowed to push (excludes id/user_id/timestamps)
     */
    public function __construct(
        public readonly string $key,
        public readonly string $modelClass,
        public readonly array $fillableFields,
    ) {}
}
