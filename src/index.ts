import {
  createTestHost,
  createTestLibrary,
  createTestWrapper,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const StrictSddTestLibrary = createTestLibrary({
  name: "strict-sdd",
  packageRoot: await findTestPackageRoot(import.meta.url),
  typespecFileFolder: "src",
});

export async function createStrictSddTestRunner() {
  const host = await createTestHost({ libraries: [StrictSddTestLibrary] });
  return createTestWrapper(host, { autoUsings: ["StrictSdd"] });
}
