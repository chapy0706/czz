// packages/dsl-core/src/types.ts
export type DslCommand =
	| {
			type: "FILTER";
			predicate: "IS_EVEN" | "IS_ODD";
	  }
	| {
			type: "SORT";
			direction: "ASC" | "DESC";
	  };

export type DslProgram = {
	commands: DslCommand[];
};

export type DslInput = number[];
export type DslOutput = number[];
