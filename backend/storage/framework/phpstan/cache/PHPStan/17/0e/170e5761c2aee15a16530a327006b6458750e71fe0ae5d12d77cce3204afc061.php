<?php declare(strict_types = 1);

// odsl-/Users/andibauer/Repositories/basix-macro/backend/app/Models/GlobalFoodItem.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\GlobalFoodItem
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.5.6-af16c8d05d54bed7f64b00fc671ccb99cb71391c6925c0e63854c0f8bc9193ee',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\GlobalFoodItem',
        'filename' => '/Users/andibauer/Repositories/basix-macro/backend/app/Models/GlobalFoodItem.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\GlobalFoodItem',
    'shortName' => 'GlobalFoodItem',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => NULL,
    'attributes' => 
    array (
    ),
    'startLine' => 10,
    'endLine' => 49,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => 'Illuminate\\Database\\Eloquent\\Model',
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
      0 => 'Illuminate\\Database\\Eloquent\\Factories\\HasFactory',
      1 => 'App\\Models\\Concerns\\HasUuid',
    ),
    'immediateConstants' => 
    array (
    ),
    'immediateProperties' => 
    array (
      'fillable' => 
      array (
        'declaringClassName' => 'App\\Models\\GlobalFoodItem',
        'implementingClassName' => 'App\\Models\\GlobalFoodItem',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'id\', \'name\', \'brand\', \'barcode\', \'calories_per_100g\', \'protein_per_100g\', \'carbs_per_100g\', \'fat_per_100g\', \'fiber_per_100g\', \'sugar_per_100g\', \'status\', \'submitted_by\', \'reviewed_by\', \'reviewed_at\', \'rejection_reason\', \'source_food_item_id\']',
          'attributes' => 
          array (
            'startLine' => 14,
            'endLine' => 31,
            'startTokenPos' => 51,
            'startFilePos' => 306,
            'endTokenPos' => 101,
            'endFilePos' => 684,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 14,
        'endLine' => 31,
        'startColumn' => 5,
        'endColumn' => 6,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
    ),
    'immediateMethods' => 
    array (
      'casts' => 
      array (
        'name' => 'casts',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'array',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 33,
        'endLine' => 38,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\GlobalFoodItem',
        'implementingClassName' => 'App\\Models\\GlobalFoodItem',
        'currentClassName' => 'App\\Models\\GlobalFoodItem',
        'aliasName' => NULL,
      ),
      'submittedBy' => 
      array (
        'name' => 'submittedBy',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 40,
        'endLine' => 43,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\GlobalFoodItem',
        'implementingClassName' => 'App\\Models\\GlobalFoodItem',
        'currentClassName' => 'App\\Models\\GlobalFoodItem',
        'aliasName' => NULL,
      ),
      'reviewedBy' => 
      array (
        'name' => 'reviewedBy',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 45,
        'endLine' => 48,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\GlobalFoodItem',
        'implementingClassName' => 'App\\Models\\GlobalFoodItem',
        'currentClassName' => 'App\\Models\\GlobalFoodItem',
        'aliasName' => NULL,
      ),
    ),
    'traitsData' => 
    array (
      'aliases' => 
      array (
      ),
      'modifiers' => 
      array (
      ),
      'precedences' => 
      array (
      ),
      'hashes' => 
      array (
      ),
    ),
  ),
));