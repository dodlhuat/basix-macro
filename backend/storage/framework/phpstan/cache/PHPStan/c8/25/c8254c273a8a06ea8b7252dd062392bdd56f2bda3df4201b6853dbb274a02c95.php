<?php declare(strict_types = 1);

// osfsl-/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Foundation/Console/DevCommand.php-PHPStan\BetterReflection\Reflection\ReflectionClass-Illuminate\Foundation\Console\DevCommand
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-d2f2096d10e9da70d60a45047deedd913e15c0fcfd826476b65e82dfbfaa3251-8.5.6-6.70.0.1',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'filename' => '/Users/andibauer/Repositories/basix-macro/backend/vendor/composer/../laravel/framework/src/Illuminate/Foundation/Console/DevCommand.php',
      ),
    ),
    'namespace' => 'Illuminate\\Foundation\\Console',
    'name' => 'Illuminate\\Foundation\\Console\\DevCommand',
    'shortName' => 'DevCommand',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @phpstan-import-type DevCommandArray from \\Illuminate\\Foundation\\DevCommands
 */',
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
            'code' => '\'dev\'',
            'attributes' => 
            array (
              'startLine' => 17,
              'endLine' => 17,
              'startTokenPos' => 52,
              'startFilePos' => 433,
              'endTokenPos' => 52,
              'endFilePos' => 437,
            ),
          ),
        ),
      ),
    ),
    'startLine' => 17,
    'endLine' => 217,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => 'Illuminate\\Console\\Command',
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
      0 => 'Illuminate\\Console\\Prohibitable',
    ),
    'immediateConstants' => 
    array (
      'MULTIPLEX_VERSION' => 
      array (
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'name' => 'MULTIPLEX_VERSION',
        'modifiers' => 2,
        'type' => NULL,
        'value' => 
        array (
          'code' => '\'0.4\'',
          'attributes' => 
          array (
            'startLine' => 27,
            'endLine' => 27,
            'startTokenPos' => 81,
            'startFilePos' => 632,
            'endTokenPos' => 81,
            'endFilePos' => 636,
          ),
        ),
        'docComment' => '/**
 * The version of `@laravel/multiplex` to use.
 *
 * @var string
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 27,
        'endLine' => 27,
        'startColumn' => 5,
        'endColumn' => 46,
      ),
    ),
    'immediateProperties' => 
    array (
      'signature' => 
      array (
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'name' => 'signature',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'dev
        {--s|stream : Start in stream mode}
        {--t|tabs : Start in tabs mode}
        {--i|inline : Print output inline instead of rendering the TUI (the default when not a TTY)}
        {--timestamps : Display timestamps on each output line}
        {--no-restart : Disable auto-restart on crash}
        {--json : Emit newline-delimited JSON events. Implies --inline}
        {--buffer-size= : Set the max lines per command buffer}
        {--stream-buffer-size= : Set the max lines in the stream buffer}\'',
          'attributes' => 
          array (
            'startLine' => 34,
            'endLine' => 42,
            'startTokenPos' => 92,
            'startFilePos' => 763,
            'endTokenPos' => 92,
            'endFilePos' => 1280,
          ),
        ),
        'docComment' => '/**
 * The name and signature of the console command.
 *
 * @var string
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 34,
        'endLine' => 42,
        'startColumn' => 5,
        'endColumn' => 74,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
      'description' => 
      array (
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'name' => 'description',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '\'Run the dev processes\'',
          'attributes' => 
          array (
            'startLine' => 49,
            'endLine' => 49,
            'startTokenPos' => 103,
            'startFilePos' => 1395,
            'endTokenPos' => 103,
            'endFilePos' => 1417,
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
        'startLine' => 49,
        'endLine' => 49,
        'startColumn' => 5,
        'endColumn' => 53,
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
          'packageManager' => 
          array (
            'name' => 'packageManager',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'Illuminate\\Support\\NodePackageManager',
                'isIdentifier' => false,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 58,
            'endLine' => 58,
            'startColumn' => 28,
            'endColumn' => 61,
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
 *
 * @throws \\Exception
 */',
        'startLine' => 58,
        'endLine' => 70,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Foundation\\Console',
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'currentClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'aliasName' => NULL,
      ),
      'runViaMultiplex' => 
      array (
        'name' => 'runViaMultiplex',
        'parameters' => 
        array (
          'devCommands' => 
          array (
            'name' => 'devCommands',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'array',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 79,
            'endLine' => 79,
            'startColumn' => 40,
            'endColumn' => 57,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
          'packageManager' => 
          array (
            'name' => 'packageManager',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'Illuminate\\Support\\NodePackageManager',
                'isIdentifier' => false,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 79,
            'endLine' => 79,
            'startColumn' => 60,
            'endColumn' => 93,
            'parameterIndex' => 1,
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
 * Run the dev commands via `@laravel/multiplex`.
 *
 * @param  DevCommandArray[]  $devCommands
 * @param  NodePackageManager  $packageManager
 * @return int
 */',
        'startLine' => 79,
        'endLine' => 92,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Illuminate\\Foundation\\Console',
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'currentClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'aliasName' => NULL,
      ),
      'buildMultiplexCommand' => 
      array (
        'name' => 'buildMultiplexCommand',
        'parameters' => 
        array (
          'devCommands' => 
          array (
            'name' => 'devCommands',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'array',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 100,
            'endLine' => 100,
            'startColumn' => 46,
            'endColumn' => 63,
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
            'name' => 'string',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Build the command to run `@laravel/multiplex` with the given dev commands.
 *
 * @param  DevCommandArray[]  $devCommands
 * @return string
 */',
        'startLine' => 100,
        'endLine' => 145,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Illuminate\\Foundation\\Console',
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'currentClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'aliasName' => NULL,
      ),
      'runViaConcurrently' => 
      array (
        'name' => 'runViaConcurrently',
        'parameters' => 
        array (
          'devCommands' => 
          array (
            'name' => 'devCommands',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'array',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 154,
            'endLine' => 154,
            'startColumn' => 43,
            'endColumn' => 60,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
          'packageManager' => 
          array (
            'name' => 'packageManager',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'Illuminate\\Support\\NodePackageManager',
                'isIdentifier' => false,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 154,
            'endLine' => 154,
            'startColumn' => 63,
            'endColumn' => 96,
            'parameterIndex' => 1,
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
 * Run the dev commands via `concurrently`.
 *
 * @param  DevCommandArray[]  $devCommands
 * @param  NodePackageManager  $packageManager
 * @return int
 */',
        'startLine' => 154,
        'endLine' => 184,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Illuminate\\Foundation\\Console',
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'currentClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'aliasName' => NULL,
      ),
      'buildConcurrentlyCommand' => 
      array (
        'name' => 'buildConcurrentlyCommand',
        'parameters' => 
        array (
          'devCommands' => 
          array (
            'name' => 'devCommands',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'array',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 192,
            'endLine' => 192,
            'startColumn' => 49,
            'endColumn' => 66,
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
            'name' => 'string',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Build the command to run `concurrently` with the given dev commands.
 *
 * @param  DevCommandArray[]  $devCommands
 * @return string
 */',
        'startLine' => 192,
        'endLine' => 216,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Illuminate\\Foundation\\Console',
        'declaringClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'implementingClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
        'currentClassName' => 'Illuminate\\Foundation\\Console\\DevCommand',
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