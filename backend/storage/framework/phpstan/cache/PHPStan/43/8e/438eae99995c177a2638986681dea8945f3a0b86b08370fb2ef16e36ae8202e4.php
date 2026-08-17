<?php declare(strict_types = 1);

// osfsl-/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Queue/Console/ResumeCommand.php-PHPStan\BetterReflection\Reflection\ReflectionClass-Illuminate\Queue\Console\ResumeCommand
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-5455e298e44f352a4f3834dadc659c26b372b27dbb8aee0976aa4a2d6974eedd-8.5.6-6.70.0.1',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'filename' => '/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Queue/Console/ResumeCommand.php',
      ),
    ),
    'namespace' => 'Illuminate\\Queue\\Console',
    'name' => 'Illuminate\\Queue\\Console\\ResumeCommand',
    'shortName' => 'ResumeCommand',
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
            'code' => '\'queue:resume\'',
            'attributes' => 
            array (
              'startLine' => 10,
              'endLine' => 10,
              'startTokenPos' => 37,
              'startFilePos' => 253,
              'endTokenPos' => 37,
              'endFilePos' => 266,
            ),
          ),
          'aliases' => 
          array (
            'code' => '[\'queue:continue\']',
            'attributes' => 
            array (
              'startLine' => 10,
              'endLine' => 10,
              'startTokenPos' => 43,
              'startFilePos' => 278,
              'endTokenPos' => 45,
              'endFilePos' => 295,
            ),
          ),
        ),
      ),
    ),
    'startLine' => 10,
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
        'declaringClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'name' => 'signature',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'queue:resume
                            {queue? : The name of the queue that should resume processing}
                            {--all : Resume job processing for all queues on all connections}\'',
          'attributes' => 
          array (
            'startLine' => 20,
            'endLine' => 22,
            'startTokenPos' => 72,
            'startFilePos' => 461,
            'endTokenPos' => 72,
            'endFilePos' => 659,
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
        'startLine' => 20,
        'endLine' => 22,
        'startColumn' => 5,
        'endColumn' => 95,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
      'aliases' => 
      array (
        'declaringClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'name' => 'aliases',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'queue:continue\']',
          'attributes' => 
          array (
            'startLine' => 29,
            'endLine' => 29,
            'startTokenPos' => 83,
            'startFilePos' => 777,
            'endTokenPos' => 85,
            'endFilePos' => 794,
          ),
        ),
        'docComment' => '/**
 * The console command name aliases.
 *
 * @var list<string>
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 29,
        'endLine' => 29,
        'startColumn' => 5,
        'endColumn' => 44,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
      'description' => 
      array (
        'declaringClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'name' => 'description',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'Resume job processing for a paused queue\'',
          'attributes' => 
          array (
            'startLine' => 36,
            'endLine' => 36,
            'startTokenPos' => 96,
            'startFilePos' => 909,
            'endTokenPos' => 96,
            'endFilePos' => 950,
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
        'startLine' => 36,
        'endLine' => 36,
        'startColumn' => 5,
        'endColumn' => 72,
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
            'startLine' => 43,
            'endLine' => 43,
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
        'startLine' => 43,
        'endLine' => 66,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Queue\\Console',
        'declaringClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'implementingClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
        'currentClassName' => 'Illuminate\\Queue\\Console\\ResumeCommand',
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