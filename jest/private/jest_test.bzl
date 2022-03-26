"Implementation details for jest_test rule"

load("@aspect_rules_js//js:nodejs_binary.bzl", nodejs_binary_lib = "lib")

attrs = dict(nodejs_binary_lib.attrs, **{
    "srcs": attr.label_list(mandatory = True, doc = "TODO", allow_files = True),
    "entry_point": attr.label(default = Label("//jest/private:run_jest.js"), allow_single_file = True),
    "config": attr.label(doc = "jest config file, see TODO", allow_single_file = [".js"]),
})

def implementation(ctx):
    args = ctx.attr.args[:]
    args.extend([
        # Caching is Bazel's job, we don't want non-hermeticity
        # TODO: would there be some performance advantage to allowing it?
        "--no-cache",
        # Watching is ibazel's job
        "--no-watchman",
        # TODO: why?
        "--ci",
        # TODO: why?
        "--colors",
        "--config",
        ctx.file.config.path,
    ])
    for src in ctx.files.srcs:
        args.extend(["--runTestsByPath", src.path])

    launcher = nodejs_binary_lib.create_launcher(ctx, args)
    runfiles = launcher.runfiles.merge(ctx.runfiles(
        files = ctx.files.config + ctx.files.srcs
    ))
    
    return [
        DefaultInfo(
            executable = launcher.exe,
            runfiles = runfiles,
        ),
    ]

lib = struct(
    attrs = attrs,
    implementation = implementation,
)