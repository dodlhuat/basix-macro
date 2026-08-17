<?php declare(strict_types = 1);

// osfsl-/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Queue/Console/PauseCommand.php-PHPStan\BetterReflection\Reflection\ReflectionClass-Illuminate\Queue\Console\PauseCommand
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-789de9eed1b56a508839672094c821ca14b7f6203067c871bec261ffcb0076f6-8.5.6-6.70.0.1',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'filename' => '/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Queue/Console/PauseCommand.php',
      ),
    ),
    'namespace' => 'Illuminate\\Queue\\Console',
    'name' => 'Illuminate\\Queue\\Console\\PauseCommand',
    'shortName' => 'PauseCommand',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => NULL,
    'attributes' => 
    array (
      0 => 
      array (
        'name' => 'Symfony\\Component\\Console\\Attribute\\AsCommand',
        'isRepeated' => false,
        'arguments' => 
        array (
          'name' => 
          array (
            'code' => '\'queue:pause\'',
            'attributes' => 
            array (
              'startLine' => 11,
              'endLine' => 11,
              'startTokenPos' => 42,
              'startFilePos' => 282,
              'endTokenPos' => 42,
              'endFilePos' => 294,
            ),
          ),
        ),
      ),
    ),
    'startLine' => 11,
    'endLine' => 67,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => 'Illuminate\\Console\\Command',
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
      0 => 'Illuminate\\Queue\\Console\\Concerns\\ParsesQueue',
    ),
    'immediateConstants' => 
    array (
    ),
    'immediateProperties' => 
    array (
      'signature' => 
      array (
        'declaringClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'name' => 'signature',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'queue:pause
                            {queue? : The name of the queue to pause}
                            {--all : Pause job processing for all queues on all connections}\'',
          'attributes' => 
          array (
            'startLine' => 21,
            'endLine' => 23,
            'startTokenPos' => 69,
            'startFilePos' => 459,
            'endTokenPos' => 69,
            'endFilePos' => 634,
          ),
        ),
        'docComment' => '/**
 * The console command name.
 *
 * @var string
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 21,
        'endLine' => 23,
        'startColumn' => 5,
        'endColumn' => 94,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
      'description' => 
      array (
        'declaringClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'name' => 'description',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'Pause job processing for a specific queue\'',
          'attributes' => 
          array (
            'startLine' => 30,
            'endLine' => 30,
            'startTokenPos' => 80,
            'startFilePos' => 749,
            'endTokenPos' => 80,
            'endFilePos' => 791,
          ),
        ),
        'docComment' => '/**
 * The console command description.
 *
 * @var string
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 30,
        'endLine' => 30,
        'startColumn' => 5,
        'endColumn' => 73,
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
      'handle' => 
      array (
        'name' => 'handle',
        'parameters' => 
        array (
          'manager' => 
          array (
            'name' => 'manager',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'Illuminate\\Contracts\\Queue\\Factory',
                'isIdentifier' => false,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 37,
            'endLine' => 37,
            'startColumn' => 28,
            'endColumn' => 48,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'int',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Execute the console command.
 *
 * @return int
 */',
        'startLine' => 37,
        'endLine' => 66,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Queue\\Console',
        'declaringClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
        'currentClassName' => 'Illuminate\\Queue\\Console\\PauseCommand',
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