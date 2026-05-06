## Status

- Resolved: nested `<button>` markup in `components/editor/project-sidebar.tsx` caused the hydration error on `/editor/[roomId]`.
- Resolved: PostgreSQL SSL warning removed by changing checked-in `DATABASE_URL` values to `sslmode=verify-full`.
- Note: the `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` body attributes in the hydration log are browser-extension noise, not an app defect. No suppression was added.

## Error Type
Console Error

## Error Message
(node:331366) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)


    at EditorLayout (<anonymous>:null:null)

Next.js version: 16.2.4 (Turbopack)

## Error Type
Console Error

## Error Message
In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

  ...
    <CompositeList elementsRef={{current:[...]}}>
      <div data-orientation="horizontal" data-activation-direction="none" data-slot="tabs" ref={null} ...>
        <TabsList>
        <TabsContent value="my-projects" className="flex-1 fle...">
          <TabPanel data-slot="tabs-content" className="text-sm ou..." value="my-projects">
            <div data-orientation="horizontal" data-activation-direction="none" aria-labelledby={undefined} ...>
              <ScrollArea className="flex-1">
                <ScrollAreaRoot data-slot="scroll-area" className="relative f...">
                  <style>
                  <div role="presentation" onPointerEnter={function} onPointerMove={function} onPointerDown={function} ...>
                    <ScrollAreaViewport data-slot="scroll-are..." className="size-full ...">
                      <div role="presentation" data-id="base-ui-_R..." tabIndex={-1} className="size-full ..." ...>
                        <div className="p-2 space-y-1">
>                         <button
>                           type="button"
>                           onClick={function onClick}
>                           className="group flex w-full items-center justify-between rounded-xl border px-2 py-2 text..."
>                         >
                            <span>
                            <div className="flex items...">
                              <Button variant="ghost" size="icon" className="h-7 w-7 te..." onClick={function onClick}>
                                <Button data-slot="button" className={"group/bu..."} onClick={function onClick}>
>                                 <button
>                                   type="button"
>                                   onClick={function}
>                                   onMouseDown={function}
>                                   onKeyDown={function}
>                                   onKeyUp={function}
>                                   onPointerDown={function}
>                                   tabIndex={0}
>                                   disabled={false}
>                                   data-slot="button"
>                                   ref={function}
>                                   className={"group/button inline-flex shrink-0 items-center justify-center rounded..."}
>                                 >
                              ...
                    ...
        ...



    at button (<anonymous>:null:null)
    at Button (components/ui/button.tsx:50:5)
    at <unknown> (components/editor/project-sidebar.tsx:98:27)
    at Array.map (<anonymous>:null:null)
    at ProjectSidebar (components/editor/project-sidebar.tsx:70:35)
    at EditorShell (components/editor/editor-shell.tsx:28:7)
    at EditorWorkspacePage (app/editor/[roomId]/page.tsx:25:5)

## Code Frame
  48 | }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  49 |   return (
> 50 |     <ButtonPrimitive
     |     ^
  51 |       data-slot="button"
  52 |       className={cn(buttonVariants({ variant, size, className }))}
  53 |       {...props}

Next.js version: 16.2.4 (Turbopack)


## Error Type
Console Error

## Error Message
<button> cannot contain a nested <button>.
See this log for the ancestor stack trace.


    at button (<anonymous>:null:null)
    at <unknown> (components/editor/project-sidebar.tsx:71:23)
    at Array.map (<anonymous>:null:null)
    at ProjectSidebar (components/editor/project-sidebar.tsx:70:35)
    at EditorShell (components/editor/editor-shell.tsx:28:7)
    at EditorWorkspacePage (app/editor/[roomId]/page.tsx:25:5)

## Code Frame
  69 |                   ) : (
  70 |                     ownedProjects.map((project) => (
> 71 |                       <button
     |                       ^
  72 |                         type="button"
  73 |                         key={project.id}
  74 |                         onClick={() => navigateTo(project)}

Next.js version: 16.2.4 (Turbopack)


## Error Type
Recoverable Error

## Error Message
Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SegmentViewNode type="layout" pagePath="layout.tsx">
      <SegmentTrieNode>
      <link>
      <script>
      <script>
      <script>
      <script>
      <script>
      <script>
      <RootLayout>
        <ClerkProvider>
          <ClientClerkProvider ui={{__brand:"_...", ...}} appearance={{theme:{...}, ...}} publishableKey="pk_test_ZG..." ...>
            ...
              <ClerkProvider ui={{__brand:"_...", ...}} appearance={{theme:{...}, ...}} publishableKey="pk_test_ZG..." ...>
                <ClerkProviderBase ui={{__brand:"_...", ...}} appearance={{theme:{...}, ...}} ...>
                  <ClerkContextProvider initialState={undefined} clerk={{clerkjs:null, ...}} clerkStatus="loading">
                    <InitialStateProvider initialState={undefined}>
                      <__experimental_CheckoutProvider value={undefined}>
                        <RouterTelemetry>
                        <ClerkScripts>
                        <html lang="en" className="geist_a715...">
                          <body
                            className="min-h-full flex flex-col"
-                           data-new-gr-c-s-check-loaded="14.1289.0"
-                           data-gr-ext-installed=""
                          >



    at button (<anonymous>:null:null)
    at Button (components/ui/button.tsx:50:5)
    at <unknown> (components/editor/project-sidebar.tsx:98:27)
    at Array.map (<anonymous>:null:null)
    at ProjectSidebar (components/editor/project-sidebar.tsx:70:35)
    at EditorShell (components/editor/editor-shell.tsx:28:7)
    at EditorWorkspacePage (app/editor/[roomId]/page.tsx:25:5)

## Code Frame
  48 | }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  49 |   return (
> 50 |     <ButtonPrimitive
     |     ^
  51 |       data-slot="button"
  52 |       className={cn(buttonVariants({ variant, size, className }))}
  53 |       {...props}

Next.js version: 16.2.4 (Turbopack)
