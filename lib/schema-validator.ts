export interface ValidationError {
  path: string
  message: string
  value: any
}

export function validateJsonSchema(data: any, schemaString: string): ValidationError[] {
  const errors: ValidationError[] = []

  try {
    const schema = JSON.parse(schemaString)
    validateAgainstSchema(data, schema, "", errors)
  } catch (error) {
    errors.push({
      path: "schema",
      message: "Invalid schema format",
      value: schemaString,
    })
  }

  return errors
}

function validateAgainstSchema(data: any, schema: any, path: string, errors: ValidationError[]) {
  // Basic type validation with improved integer handling
  if (schema.type) {
    const actualType = getJsonType(data)
    const expectedType = schema.type

    // Special handling for integer type
    if (expectedType === "integer") {
      if (typeof data !== "number") {
        errors.push({
          path,
          message: `Expected integer, got ${actualType}`,
          value: data,
        })
        return
      }

      // Check if it's actually an integer (not just a number)
      if (!Number.isInteger(data)) {
        errors.push({
          path,
          message: `Expected integer, got decimal number ${data}`,
          value: data,
        })
        return
      }

      // Check for special number values
      if (!Number.isFinite(data)) {
        errors.push({
          path,
          message: `Expected finite integer, got ${data}`,
          value: data,
        })
        return
      }
    } else if (expectedType === "number") {
      if (typeof data !== "number") {
        errors.push({
          path,
          message: `Expected number, got ${actualType}`,
          value: data,
        })
        return
      }

      // Check for special number values
      if (!Number.isFinite(data)) {
        errors.push({
          path,
          message: `Expected finite number, got ${data}`,
          value: data,
        })
        return
      }
    } else if (actualType !== expectedType) {
      errors.push({
        path,
        message: `Expected type ${expectedType}, got ${actualType}`,
        value: data,
      })
      return
    }
  }

  // Required properties validation
  if (schema.required && Array.isArray(schema.required)) {
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      schema.required.forEach((prop: string) => {
        if (!(prop in data)) {
          errors.push({
            path: path ? `${path}.${prop}` : prop,
            message: `Missing required property: ${prop}`,
            value: undefined,
          })
        }
      })
    }
  }

  // Properties validation for objects
  if (schema.properties && typeof data === "object" && data !== null && !Array.isArray(data)) {
    Object.entries(schema.properties).forEach(([prop, propSchema]) => {
      if (prop in data) {
        const propPath = path ? `${path}.${prop}` : prop
        validateAgainstSchema(data[prop], propSchema, propPath, errors)
      }
    })

    // Additional properties validation
    if (schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties))
      Object.keys(data).forEach((prop) => {
        if (!allowedProps.has(prop)) {
          errors.push({
            path: path ? `${path}.${prop}` : prop,
            message: `Additional property not allowed: ${prop}`,
            value: data[prop],
          })
        }
      })
    }
  }

  // Array items validation
  if (schema.items && Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`
      validateAgainstSchema(item, schema.items, itemPath, errors)
    })
  }

  // Array length validation
  if (Array.isArray(data)) {
    if (schema.minItems && data.length < schema.minItems) {
      errors.push({
        path,
        message: `Array too short. Minimum items: ${schema.minItems}, got ${data.length}`,
        value: data,
      })
    }

    if (schema.maxItems && data.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array too long. Maximum items: ${schema.maxItems}, got ${data.length}`,
        value: data,
      })
    }

    if (schema.uniqueItems === true) {
      const seen = new Set()
      const duplicates = new Set()

      data.forEach((item, index) => {
        const itemStr = JSON.stringify(item)
        if (seen.has(itemStr)) {
          duplicates.add(index)
        } else {
          seen.add(itemStr)
        }
      })

      if (duplicates.size > 0) {
        errors.push({
          path,
          message: `Array items must be unique. Duplicate items at indices: ${Array.from(duplicates).join(", ")}`,
          value: data,
        })
      }
    }
  }

  // String validation
  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        path,
        message: `String too short. Minimum length: ${schema.minLength}, got ${data.length}`,
        value: data,
      })
    }

    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        path,
        message: `String too long. Maximum length: ${schema.maxLength}, got ${data.length}`,
        value: data,
      })
    }

    if (schema.pattern) {
      try {
        const regex = new RegExp(schema.pattern)
        if (!regex.test(data)) {
          errors.push({
            path,
            message: `String does not match pattern: ${schema.pattern}`,
            value: data,
          })
        }
      } catch (error) {
        errors.push({
          path,
          message: `Invalid regex pattern: ${schema.pattern}`,
          value: schema.pattern,
        })
      }
    }

    if (schema.format) {
      const formatValidators: Record<string, (value: string) => boolean> = {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        uri: (value) => {
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
        date: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)),
        "date-time": (value) => !isNaN(Date.parse(value)),
        uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
      }

      const validator = formatValidators[schema.format]
      if (validator && !validator(data)) {
        errors.push({
          path,
          message: `String does not match format: ${schema.format}`,
          value: data,
        })
      }
    }
  }

  // Number/Integer validation
  if (typeof data === "number" && Number.isFinite(data)) {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path,
        message: `Number too small. Minimum: ${schema.minimum}, got ${data}`,
        value: data,
      })
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path,
        message: `Number too large. Maximum: ${schema.maximum}, got ${data}`,
        value: data,
      })
    }

    if (schema.exclusiveMinimum !== undefined && data <= schema.exclusiveMinimum) {
      errors.push({
        path,
        message: `Number must be greater than ${schema.exclusiveMinimum}, got ${data}`,
        value: data,
      })
    }

    if (schema.exclusiveMaximum !== undefined && data >= schema.exclusiveMaximum) {
      errors.push({
        path,
        message: `Number must be less than ${schema.exclusiveMaximum}, got ${data}`,
        value: data,
      })
    }

    if (schema.multipleOf !== undefined && schema.multipleOf > 0) {
      const division = data / schema.multipleOf
      if (!Number.isInteger(division)) {
        errors.push({
          path,
          message: `Number must be a multiple of ${schema.multipleOf}, got ${data}`,
          value: data,
        })
      }
    }
  }

  // Enum validation
  if (schema.enum && Array.isArray(schema.enum)) {
    const enumValues = schema.enum
    const dataStr = JSON.stringify(data)
    const isValid = enumValues.some((enumValue) => JSON.stringify(enumValue) === dataStr)

    if (!isValid) {
      errors.push({
        path,
        message: `Value must be one of: ${enumValues.map((v) => JSON.stringify(v)).join(", ")}. Got: ${dataStr}`,
        value: data,
      })
    }
  }

  // Const validation
  if (schema.const !== undefined) {
    if (JSON.stringify(data) !== JSON.stringify(schema.const)) {
      errors.push({
        path,
        message: `Value must be exactly: ${JSON.stringify(schema.const)}. Got: ${JSON.stringify(data)}`,
        value: data,
      })
    }
  }

  // OneOf validation
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const validSchemas = schema.oneOf.filter((subSchema: any) => {
      const subErrors: ValidationError[] = []
      validateAgainstSchema(data, subSchema, path, subErrors)
      return subErrors.length === 0
    })

    if (validSchemas.length !== 1) {
      errors.push({
        path,
        message: `Data must match exactly one schema. Matched ${validSchemas.length} schemas.`,
        value: data,
      })
    }
  }

  // AnyOf validation
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const validSchemas = schema.anyOf.filter((subSchema: any) => {
      const subErrors: ValidationError[] = []
      validateAgainstSchema(data, subSchema, path, subErrors)
      return subErrors.length === 0
    })

    if (validSchemas.length === 0) {
      errors.push({
        path,
        message: `Data must match at least one schema. Matched 0 schemas.`,
        value: data,
      })
    }
  }

  // AllOf validation
  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema.allOf.forEach((subSchema: any, index: number) => {
      validateAgainstSchema(data, subSchema, path, errors)
    })
  }
}

function getJsonType(value: any): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  if (typeof value === "number") {
    // For schema validation, we distinguish between integer and number
    return Number.isInteger(value) ? "integer" : "number"
  }
  return typeof value
}
