module.exports = function ({ types: t }) {
  const ALLOWED_STATE_PROPERTY = ["size"];
  function isStateCallee(path, t) {
    const init = path.node.init;
    if (t.isCallExpression(init)) {
      const node = init.callee;

      if (t.isIdentifier(node, { name: "state" })) return true;

      if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        const isVebelObj = t.isIdentifier(node.object, { name: "Vebel" });

        let isDefine =
          (!node.computed &&
            t.isIdentifier(node.property, { name: "state" })) ||
          (node.computed &&
            t.isStringLiteral &&
            t.isStringLiteral(node.property, { value: "state" }));

        return isVebelObj && isDefine;
      }
    }
    return false;
  }

  function isPreserveStateCallee(path, t) {
    const init = path.node.init;
    if (t.isCallExpression(init)) {
      const node = init.callee;

      if (t.isIdentifier(node, { name: "preservedState" })) return true;

      if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        const isVebelObj = t.isIdentifier(node.object, { name: "Vebel" });

        let isDefine =
          (!node.computed &&
            t.isIdentifier(node.property, { name: "preservedState" })) ||
          (node.computed &&
            t.isStringLiteral &&
            t.isStringLiteral(node.property, { value: "preservedState" }));

        return isVebelObj && isDefine;
      }
    }
    return false;
  }

  function isFromParentCallee(node, t) {
    // ensure destructuring
    if (!t.isObjectPattern(node.id)) return;

    const init = node.init;

    if (!t.isMemberExpression(init)) return;

    // detect .state / .list
    if (!t.isIdentifier(init.property)) return;
    const prop = init.property.name;

    if (prop !== "state" && prop !== "list") return;

    // detect from()
    if (!t.isCallExpression(init.object)) return;
    const call = init.object;

    if (!t.isIdentifier(call.callee, { name: "from" })) return;

    const vars = [];

    node.id.properties.forEach((p) => {
      if (t.isRestElement(p)) return;

      // const { state1 }
      if (t.isIdentifier(p.key) && t.isIdentifier(p.value)) {
        vars.push(p.value.name);
      }

      // const { state1: state2 }
      else if (t.isIdentifier(p.value)) {
        vars.push(p.value.name);
      }

      // const { [stateName]: state3 }
      else if (t.isComputedPropertyName && t.isIdentifier(p.value)) {
        vars.push(p.value.name);
      }
    });

    return vars;
  }

  function isUseGlobalCallee(init, t) {
    if (!t.isCallExpression(init)) return;

    const node = init.callee;
    if (t.isIdentifier(node, { name: "useGlobal" })) return true;

    if (t.isMemberExpression(node)) {
      const objOK = t.isIdentifier(node.object, { name: "Vebel" });
      const propOK =
        (!node.computed &&
          t.isIdentifier(node.property, { name: "useGlobal" })) ||
        (node.computed &&
          t.isStringLiteral(node.property, { value: "useGlobal" }));
      return objOK && propOK;
    }

    return false;
  }

  function isUpperCamel(name) {
    if (!name) return false;
    return /^[A-Z]/.test(name || "");
  }
  function functionHasJSX(fnPath) {
    let has = false;
    fnPath.traverse({
      JSXElement() {
        has = true;
        // fnPath.stop();
      },
    });
    return has;
  }
  function isComponentFunction(path) {
    // function Comp() {}  OR  const Comp = () => {}
    if (path.isFunctionDeclaration() && isUpperCamel(path.node?.id?.name))
      return true;
    if (path.isFunctionExpression() || path.isArrowFunctionExpression()) {
      // try to read binding name if assigned: const Comp = () => {}
      const parent = path.parentPath;
      const name =
        parent.isVariableDeclarator() && t.isIdentifier(parent.node.id)
          ? parent.node.id.name
          : null;

      return isUpperCamel(name); // functionHasJSX
    }
    return false;
  }

  function getStateConfig(stateVars) {
    let prevSv = new Set();

    const stateArr = stateVars.reduce((acc, crr) => {
      if (!prevSv.has(crr)) {
        acc.push(t.identifier(crr));
        prevSv.add(crr);
      }

      return acc;
    }, []);

    return stateArr;
  }

  function traverseStateProperty(path, stateRef) {
    const { node } = path;
    const obj = node.object;

    if (t.isIdentifier(obj)) {
      if (!stateRef.has(obj.name)) return;

      const prop = node.property;
      let propName = null;

      if (!node.computed && t.isIdentifier(prop)) {
        // posts.size
        propName = prop.name;
      }

      if (node.computed && t.isStringLiteral(prop)) {
        // posts['size']
        propName = prop.value;
      }

      if (!propName) return;
      if (ALLOWED_STATE_PROPERTY.includes(propName)) {
        return obj.name;
      }
    }
  }

  function traverseNode(path, stateRef) {
    let stateVars = [];

    if (
      path.isFunctionExpression() ||
      path.isArrowFunctionExpression() ||
      path.isFunctionDeclaration()
    ) {
      return [];
    }

    if (path.isCallExpression()) {
      const { callee, arguments: args } = path.node;
      if (!t.isIdentifier(callee)) return [];
      const stateName = callee.name;
      if (stateRef.has(stateName)) {
        if (args.length !== 0) {
          throw path.buildCodeFrameError(
            `${callee.name}() is a reactive state, it does not accept arguments.`,
          );
        }
        stateVars.push(stateName);
      }
      return stateVars;
    }

    if (path.isMemberExpression()) {
      const memberProp = traverseStateProperty(path, stateRef);
      if (memberProp) {
        stateVars.push(memberProp);
      }
      return stateVars;
    }

    path.traverse({
      Function(innerPath) {
        innerPath.skip();
      },
      MemberExpression(mbPath) {
        const memberProp = traverseStateProperty(mbPath, stateRef);
        if (memberProp) {
          stateVars.push(memberProp);
        }
        return;
      },
      CallExpression(callPath) {
        const { callee, arguments: args } = callPath.node;
        if (!t.isIdentifier(callee)) return;
        const stateName = callee.name;
        if (stateRef.has(stateName)) {
          if (args.length !== 0) {
            throw path.buildCodeFrameError(
              `${callee.name}() is a reactive state, it does not accept arguments.`,
            );
          }
          stateVars.push(stateName);
        }
      },
    });

    return stateVars;
  }

  function isPrimitiveReactiveBranch(path, stateRef) {
    let hasJSX = false;

    path.traverse({
      JSXElement(jsxPath) {
        hasJSX = true;
        jsxPath.stop();
      },

      JSXFragment(jsxPath) {
        hasJSX = true;
        jsxPath.stop();
      },
    });

    if (hasJSX) return false;

    const states = traverseNode(path, stateRef);

    return states.length > 0;
  }

  function containsJSX(path) {
    if (path.isJSXElement() || path.isJSXFragment()) {
      return true;
    }

    let found = false;

    path.traverse({
      JSXElement(p) {
        found = true;
        p.stop();
      },

      JSXFragment(p) {
        found = true;
        p.stop();
      },
    });

    return found;
  }

  function flattenArrayElements(paths, statesRef) {
    const result = [];

    paths.forEach((elementPath) => {
      if (!elementPath?.node) return;

      // nested array
      if (elementPath.isArrayExpression()) {
        result.push(
          ...flattenArrayElements(elementPath.get("elements"), statesRef),
        );

        return;
      }

      const stateVars = traverseNode(elementPath, statesRef);

      // static
      if (!stateVars.length) {
        result.push(elementPath.node);

        return;
      }

      // reactive
      result.push(
        t.objectExpression([
          t.objectProperty(
            t.identifier("states"),
            t.arrayExpression(getStateConfig(stateVars)),
          ),

          t.objectProperty(
            t.identifier("eval"),
            t.arrowFunctionExpression([], elementPath.node),
          ),
        ]),
      );
    });

    return result;
  }

  function isComponentPropExpression(path, systemComponents) {
    const attrPath = path.parentPath;
    if (!attrPath?.isJSXAttribute()) return false;

    const openingEl = attrPath.parentPath;
    if (!openingEl?.isJSXOpeningElement()) return false;

    const tagIdentifier = openingEl.node.name;
    const tagName = tagIdentifier?.name;

    if (!tagName) return false;

    if (systemComponents && systemComponents?.includes(tagName)) {
      return false;
    } else {
      return t.isJSXIdentifier(tagIdentifier) && /^[A-Z]/.test(tagName);
    }
  }

  return {
    pre() {
      this.stateTable = null;
      this.systemComponents = [];
      this.indexTracker = new Map();
    },
    visitor: {
      ImportDeclaration(path, state) {
        const importPath = path.node.source.value;
        if (importPath && importPath === "@vebeljs/vebel") {
          path.node.specifiers.forEach((spec) => {
            if (t.isImportSpecifier(spec)) {
              if (
                spec.imported.name === "For" ||
                spec.imported.name === "Link"
              ) {
                state.systemComponents?.push(spec.local.name);
              }
            }
          });
        }
      },
      FunctionDeclaration: {
        enter(path, state) {
          if (!isComponentFunction(path)) return;

          path.setData("isComponent", true);

          state.stateTable = new Set();
        },
        exit(path, state) {
          if (path?.getData("isComponent")) state.stateTable = null;
        },
      },
      FunctionExpression: {
        enter(path, state) {
          if (!isComponentFunction(path)) return;

          path.setData("isComponent", true);
          state.stateTable = new Set();
        },
        exit(path, state) {
          if (path?.getData("isComponent")) state.stateTable = null;
        },
      },
      ArrowFunctionExpression: {
        enter(path, state) {
          if (!isComponentFunction(path)) return;

          path.setData("isComponent", true);
          state.stateTable = new Set();
        },
        exit(path, state) {
          if (path?.getData("isComponent")) state.stateTable = null;
        },
      },

      VariableDeclarator(path, state) {
        // Track: const count = state("mycount", 0);

        if (isStateCallee(path, t)) {
          state.stateTable.add(path.node.id.name);
        }

        const node = path.node;
        const tempVars = isFromParentCallee(node, t);
        if (tempVars) {
          tempVars?.forEach((stateName) => {
            state.stateTable.add(stateName);
          });
        }

        if (isUseGlobalCallee(node.init, t)) {
          // Case 1: const { s1, s2 } = useGlobal()
          if (t.isObjectPattern(node.id)) {
            node.id.properties.forEach((p) => {
              if (t.isRestElement(p)) return;

              // const { state1 }
              if (t.isIdentifier(p.key) && t.isIdentifier(p.value)) {
                state.stateTable.add(p.value.name);
              }

              // const { state1: state2 }
              else if (t.isIdentifier(p.value)) {
                state.stateTable.add(p.value.name);
              }

              // const { [stateName]: state3 }
              else if (t.isComputedPropertyName && t.isIdentifier(p.value)) {
                state.stateTable.add(p.value.name);
              }
            });
          } else {
            throw path.buildCodeFrameError(
              `Extract state from useGlobal() as destructured properties. const { state1, state2 } = useGlobal().`,
            );
          }
        }

        if (isPreserveStateCallee(path, t)) {
          state.stateTable.add(path.node.id.name);
        }
      },

      JSXElement: {
        enter(path, state) {
          if (
            !path.get("openingElement.name").isJSXIdentifier({ name: "For" })
          ) {
            return;
          }

          const eachAttr = path
            .get("openingElement.attributes")
            .find((attr) => attr.node.name?.name === "each");

          if (!eachAttr) return;

          const children = path.get("children");

          const exprContainer = children.find((child) =>
            child.isJSXExpressionContainer(),
          );

          if (!exprContainer) return;

          const exprPath = exprContainer.get("expression");

          if (!exprPath.isArrowFunctionExpression()) {
            return;
          }

          const params = exprPath.get("params");
          if (!params[1]?.isIdentifier()) {
            return;
          }
          const indexState = params[1].node.name;

          state.stateTable?.add(indexState);
          state.indexTracker?.set(
            indexState,
            (state.indexTracker?.get(indexState) || 0) + 1,
          );
          path.setData("index_state", indexState);
        },

        exit(path, state) {
          const indexStateName = path.getData("index_state");
          if (indexStateName) {
            const count = (state.indexTracker?.get(indexStateName) || 0) - 1;
            if (count <= 0) {
              state.stateTable?.delete(indexStateName);
            } else {
              state.stateTable?.set(indexStateName, count);
            }
          }
        },
      },

      // inside your plugin visitor
      JSXExpressionContainer: {
        enter(path, state) {
          const exprPath = path.get("expression");

          if (!exprPath || !exprPath.node) return;

          if (t.isJSXEmptyExpression(exprPath)) return;

          if (exprPath?.isConditionalExpression()) return;

          if (exprPath?.isLogicalExpression()) return;

          if (isComponentPropExpression(path, this.systemComponents)) return;

          const statesRef = (state && state.stateTable) || this.stateTable;
          if (!statesRef) return;

          if (exprPath?.isArrayExpression()) {
            const flatElements = flattenArrayElements(
              exprPath.get("elements"),
              statesRef,
            );

            path.replaceWith(
              t.jsxExpressionContainer(t.arrayExpression(flatElements)),
            );

            path.skip();

            return;
          }

          const node = exprPath.node;

          // Traverse only the expression subtree with correct scope/parent info
          const stateVars = traverseNode(exprPath, statesRef);

          if (!stateVars.length) return;

          const stateArr = getStateConfig(stateVars);

          const wrappedExpression = t.objectExpression([
            t.objectProperty(
              t.identifier("states"),
              t.arrayExpression(stateArr),
            ),
            t.objectProperty(
              t.identifier("eval"),
              t.arrowFunctionExpression([], node),
            ),
          ]);

          // Replace the JSXExpressionContainer with the object wrapped in a JSXExpressionContainer
          path.replaceWith(t.jsxExpressionContainer(wrappedExpression));

          // CRITICAL: skip traversing the just-created node to avoid re-entering plugin logic
          path.skip();
        },
        exit(path, state) {
          const exprPath = path.get("expression");

          if (!exprPath || !exprPath.node) return;

          if (t.isJSXEmptyExpression(exprPath)) return;

          const stateRef = (state && state.stateTable) || this.stateTable;
          if (!stateRef) return;

          if (exprPath?.isLogicalExpression()) {
            const { left, right, operator } = exprPath.node;

            const leftPath = exprPath.get("left");
            const rightPath = exprPath.get("right");

            const leftStateVars = traverseNode(leftPath, stateRef);

            if (!leftStateVars.length) return;

            const shouldSkipConditionTransform =
              (operator === "||" || operator === "??") &&
              !containsJSX(rightPath);

            if (
              !shouldSkipConditionTransform &&
              ["&&", "||", "??"].includes(operator)
            ) {
              const stateArr = getStateConfig(leftStateVars);

              let evalNode;

              if (operator === "&&" || operator === "||") {
                evalNode = left;
              } else if (operator === "??") {
                evalNode = t.binaryExpression("!=", left, t.nullLiteral());
              }

              const rightReEval = isPrimitiveReactiveBranch(
                rightPath,
                stateRef,
              );

              const thenReEval = operator === "&&" ? rightReEval : true;

              const elseReEval = operator === "&&" ? false : rightReEval;

              const conditionData = [
                t.objectProperty(
                  t.identifier("eval"),
                  t.arrowFunctionExpression([], evalNode),
                ),

                t.objectProperty(
                  t.identifier("states"),
                  t.arrayExpression(stateArr),
                ),

                t.objectProperty(
                  t.identifier("then"),
                  t.arrowFunctionExpression(
                    [],
                    operator === "&&" ? right : left,
                  ),
                ),

                t.objectProperty(
                  t.identifier("else"),
                  t.arrowFunctionExpression(
                    [],
                    operator === "&&" ? t.nullLiteral() : right,
                  ),
                ),

                t.objectProperty(
                  t.identifier("thenReEval"),
                  t.booleanLiteral(thenReEval),
                ),

                t.objectProperty(
                  t.identifier("elseReEval"),
                  t.booleanLiteral(elseReEval),
                ),
              ];

              const wrappedExpression = t.objectExpression(conditionData);

              path.replaceWith(t.jsxExpressionContainer(wrappedExpression));

              path.skip();

              return;
            }

            return;
          }

          if (!exprPath.isConditionalExpression()) return;

          if (isComponentPropExpression(path, this.systemComponents)) return;

          const { test, consequent, alternate } = exprPath.node;

          const testPath = path.get("expression.test");
          const testStateVars = traverseNode(testPath, stateRef);

          if (!testStateVars.length) return;

          const consequentPath = path.get("expression.consequent");
          const alternatePath = path.get("expression.alternate");

          const c = isPrimitiveReactiveBranch(consequentPath, stateRef);
          const a = isPrimitiveReactiveBranch(alternatePath, stateRef);

          const stateArr = getStateConfig(testStateVars);

          let conditionData = [
            t.objectProperty(
              t.identifier("eval"),
              t.arrowFunctionExpression([], test),
            ),
            t.objectProperty(
              t.identifier("states"),
              t.arrayExpression(stateArr),
            ),
            t.objectProperty(t.identifier("thenReEval"), t.booleanLiteral(c)),
            t.objectProperty(t.identifier("elseReEval"), t.booleanLiteral(a)),
          ];

          const CONDITION_KEYS = [
            { identifier: "then", value: consequent },
            { identifier: "else", value: alternate },
          ];

          CONDITION_KEYS.forEach((type) => {
            conditionData.push(
              t.objectProperty(
                t.identifier(type.identifier),
                t.arrowFunctionExpression([], type.value),
              ),
            );
          });

          const wrappedExpression = t.objectExpression(conditionData);

          path.replaceWith(t.jsxExpressionContainer(wrappedExpression));

          // CRITICAL: skip traversing the just-created node to avoid re-entering plugin logic
          path.skip();

          // return;
        },
      },
    },
  };
};
