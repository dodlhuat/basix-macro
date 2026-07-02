<?php declare(strict_types = 1);

// odsl-/Users/andibauer/Repositories/basix-macro/backend/app/Models/GlobalFoodItem.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\GlobalFoodItem
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.5.6-40369c90c8d1cf73136f0aed5901fe189035047cb831571256a819228820434e',
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
    'docComment' => '/**
 * @property-read Carbon|null $reviewed_at
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 15,
    'endLine' => 59,
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
            'startLine' => 20,
            'endLine' => 37,
            'startTokenPos' => 65,
            'startFilePos' => 484,
            'endTokenPos' => 115,
            'endFilePos' => 862,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 20,
        'endLine' => 37,
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
        'startLine' => 39,
        'endLine' => 46,
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
        'docComment' => '/** @return BelongsTo<User, $this> */',
        'startLine' => 49,
        'endLine' => 52,
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
        'docComment' => '/** @return BelongsTo<User, $this> */',
        'startLine' => 55,
        'endLine' => 58,
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