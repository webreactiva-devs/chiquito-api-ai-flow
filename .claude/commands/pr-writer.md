I want you to generate the title and the body of a PR for an issue identified as the first argument `$1`.

**Branch-based mode**
You must use the commits that belong only to the current active branch and are not present in its base branch.

* Consider the "base branch" as the upstream of the current branch (`@{upstream}`).
* If no upstream is configured, you may assume `main` (or `master` if `main` does not exist) as the base branch.
* Use the merge base between the current branch (`HEAD`) and the base branch to determine the range of commits that are unique to the current branch.

Follow these steps:

1. Run this command to save all commit messages that are unique to the current branch into `commits-$1.txt`:

```bash
git log "$(git merge-base @{upstream} HEAD)"..HEAD --pretty="commit %H%nDate: %ad%n%n%B" > commits-$1.txt
```

If `@{upstream}` is not available, replace it with the appropriate base branch, for example:

```bash
git log "$(git merge-base main HEAD)"..HEAD --pretty="commit %H%nDate: %ad%n%n%B" > commits-$1.txt
```

1. Run this command to save the diff of all the changes that are unique to the current branch into `diffs-$1.patch`:

```bash
git diff "$(git merge-base @{upstream} HEAD)"..HEAD > diffs-$1.patch
```

Again, if `@{upstream}` is not configured, replace it with `main` or the appropriate base branch:

```bash
git diff "$(git merge-base main HEAD)"..HEAD > diffs-$1.patch
```

In both modes, you must always use the contents of `commits-$1.txt` and `diffs-$1.patch` as the main technical source of truth to understand what has been implemented, refactored, or fixed. Use them to extract:

* The high-level purpose of the changes.
* The main features, fixes, or refactors included.
* Any notable side effects or risks (breaking changes, schema changes, API changes, etc.).
* Any relevant context that should be surfaced to reviewers (e.g., TODOs, limitations, follow-up work).



The template you have to fill in is the following.
Give it to me in a markdown and writes in file `mr-$1.local.md`:

<pr-template>
# {title}

**Summary**

* Briefly describe what this PR does.
* Mention the main goal or feature.

**Context**

* Why is this change needed?
* Link any related issue or ticket (e.g. `Closes #123`).

**Changes**

* Change 1
* Change 2
* Change 3

## Type of Change

* [ ] Bug fix (non-breaking change which fixes an issue)
* [ ] New feature (non-breaking change which adds functionality)
* [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
* [ ] Documentation update
* [ ] Other (please describe):

**Checklist**

* [ ] I have tested this locally.
* [ ] I have updated documentation if needed.
* [ ] I have added or updated tests if needed.
* [ ] The PR title follows the project conventions.


</pr-template>

When generating `{title}`, make it concise, descriptive, and, when applicable, ensure it includes the issue identifier `$1` or a clear reference to the scope of the current branch (for example, the branch name or its main feature).

When writing the body, ensure that:

* The **Description** section summarizes the intent, the main changes, and how they relate to the original issue text inside `<issue>`.
* You explicitly mention any breaking changes, migrations, or manual steps required.
* You highlight any tests performed or test strategy you followed.

When finished, delete the files `commits-$1.txt` and `diffs-$1.patch`.