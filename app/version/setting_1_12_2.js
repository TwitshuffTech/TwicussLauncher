const { app } = require("electron")
const path = require("path")
const fs = require("fs")

const GAME_DIRECTORY = path.join(app.getPath("appData"), ".minecraft")

exports.gameExists = () => {
    return fs.existsSync(path.join(GAME_DIRECTORY,"versions/1.12.2-forge-14.23.5.2859/1.12.2-forge-14.23.5.2859.jar"))
}

exports.getArgs = (userName, uuid, minecraftAuthToken) => {
    if (!fs.existsSync(path.join(app.getPath("appData"), ".twicusslauncher/minecraft/1.12.2"))) {
        fs.mkdirSync(path.join(app.getPath("appData"), ".twicusslauncher/minecraft/1.12.2"), { recursive: true })
    }

    const JVM_ARGS = [
        `"-Dos.name=Windows 10" -Dos.version=10.0`,
        `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`,
        `-Djava.library.path=${path.join(GAME_DIRECTORY, "bin/664ffd52c57ab778a66525626e44d9d3545735fd")}`,
        `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
        `-Dminercaft.launcher.version=${"1.0"}`,
        `-Dminecraft.client.jar=${path.join(GAME_DIRECTORY, "versions/1.12.2-forge-14.23.5.2859/1.12.2-forge-14.23.5.2859.jar")}`,
        `-cp ${
            [
                path.join(GAME_DIRECTORY, "libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/ow2/asm/asm-debug-all/5.2/asm-debug-all-5.2.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/jline/jline/3.5.1/jline-3.5.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/typesafe/akka/akka-actor_2.11/2.3.3/akka-actor_2.11-2.3.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/typesafe/config/1.2.1/config-1.2.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-actors-migration_2.11/1.1.0/scala-actors-migration_2.11-1.1.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-compiler/2.11.1/scala-compiler-2.11.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/plugins/scala-continuations-library_2.11/1.0.2_mc/scala-continuations-library_2.11-1.0.2_mc.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/plugins/scala-continuations-plugin_2.11.1/1.0.2_mc/scala-continuations-plugin_2.11.1-1.0.2_mc.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-library/2.11.1/scala-library-2.11.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-parser-combinators_2.11/1.0.1/scala-parser-combinators_2.11-1.0.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-reflect/2.11.1/scala-reflect-2.11.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-swing_2.11/1.0.1/scala-swing_2.11-1.0.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/scala-lang/scala-xml_2.11/1.0.2/scala-xml_2.11-1.0.2.jar"),
                path.join(GAME_DIRECTORY, "libraries/lzma/lzma/0.0.1/lzma-0.0.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/java3d/vecmath/1.5.2/vecmath-1.5.2.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/sf/trove4j/trove4j/3.0.3/trove4j-3.0.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/maven/maven-artifact/3.5.3/maven-artifact-3.5.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/sf/jopt-simple/jopt-simple/5.0.3/jopt-simple-5.0.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/logging/log4j/log4j-api/2.15.0/log4j-api-2.15.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/logging/log4j/log4j-core/2.15.0/log4j-core-2.15.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/mojang/patchy/1.3.9/patchy-1.3.9.jar"),
                path.join(GAME_DIRECTORY, "libraries/oshi-project/oshi-core/1.1/oshi-core-1.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/java/dev/jna/jna/4.4.0/jna-4.4.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/java/dev/jna/platform/3.4.0/platform-3.4.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/ibm/icu/icu4j-core-mojang/51.2/icu4j-core-mojang-51.2.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/paulscode/codecjorbis/20101023/codecjorbis-20101023.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/paulscode/codecwav/20101023/codecwav-20101023.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/paulscode/libraryjavasound/20101123/libraryjavasound-20101123.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/paulscode/librarylwjglopenal/20100824/librarylwjglopenal-20100824.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/paulscode/soundsystem/20120107/soundsystem-20120107.jar"),
                path.join(GAME_DIRECTORY, "libraries/io/netty/netty-all/4.1.9.Final/netty-all-4.1.9.Final.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/google/guava/guava/21.0/guava-21.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/commons/commons-lang3/3.5/commons-lang3-3.5.jar"),
                path.join(GAME_DIRECTORY, "libraries/commons-io/commons-io/2.5/commons-io-2.5.jar"),
                path.join(GAME_DIRECTORY, "libraries/commons-codec/commons-codec/1.10/commons-codec-1.10.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/java/jinput/jinput/2.0.5/jinput-2.0.5.jar"),
                path.join(GAME_DIRECTORY, "libraries/net/java/jutils/jutils/1.0.0/jutils-1.0.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/google/code/gson/gson/2.8.0/gson-2.8.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/mojang/authlib/1.5.25/authlib-1.5.25.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/mojang/realms/1.10.22/realms-1.10.22.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/commons/commons-compress/1.8.1/commons-compress-1.8.1.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/httpcomponents/httpclient/4.3.3/httpclient-4.3.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/commons-logging/commons-logging/1.1.3/commons-logging-1.1.3.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/apache/httpcomponents/httpcore/4.3.2/httpcore-4.3.2.jar"),
                path.join(GAME_DIRECTORY, "libraries/it/unimi/dsi/fastutil/7.1.0/fastutil-7.1.0.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/lwjgl/lwjgl/lwjgl/2.9.4-nightly-20150209/lwjgl-2.9.4-nightly-20150209.jar"),
                path.join(GAME_DIRECTORY, "libraries/org/lwjgl/lwjgl/lwjgl_util/2.9.4-nightly-20150209/lwjgl_util-2.9.4-nightly-20150209.jar"),
                path.join(GAME_DIRECTORY, "libraries/com/mojang/text2speech/1.10.3/text2speech-1.10.3.jar"),
                path.join(GAME_DIRECTORY, "versions/1.12.2-forge-14.23.5.2859/1.12.2-forge-14.23.5.2859.jar")
            ].join(';')
        }`,
        //`-Dlog4j.configurationFile=${path.join(GAME_DIRECTORY, "assets/log_configs/client-1.12.xml")}`,
        `-Xss1M`,
    ]
    const MAIN_CLASS = "net.minecraft.launchwrapper.Launch"
    const GAME_ARGS = [
        //`--clientId ${clientid}`,
        //`--xuid ${auth_xuid}`,
        `--username ${userName}`,
        `--version ${"1.12.2-forge-14.23.5.2859"}`,
        `--gameDir ${path.join(app.getPath("appData"), ".twicusslauncher/minecraft/1.12.2")}`,
        `--assetsDir ${path.join(GAME_DIRECTORY, "assets")}`,
        `--assetsIndex ${"1.12"}`,
        `--uuid ${uuid}`,
        `--accessToken ${minecraftAuthToken}`,
        `--userType ${"msa"}`,
        `--tweakClass ${"net.minecraftforge.fml.common.launcher.FMLTweaker"}`,
        `--versionType ${"Forge"}`,
        //`--demo`,
        //`--width ${resolution_width}`,
        //`--height ${resolution_height}`,
    ]

    return JVM_ARGS.join(' ') + " " + MAIN_CLASS + " " + GAME_ARGS.join(' ')
}