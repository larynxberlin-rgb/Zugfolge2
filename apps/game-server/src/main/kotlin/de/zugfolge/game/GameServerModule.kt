package de.zugfolge.game

/** Build-time identity for the framework-free game-server module. */
public object GameServerModule {
    public const val ID: String = "game-server"

    /** S04 deliberately introduces no runtime integration or project edge. */
    public val declaredProjectDependencies: Set<String> = emptySet()
}
