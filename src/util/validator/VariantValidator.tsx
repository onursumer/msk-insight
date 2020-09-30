// This component is from Genome Nexus Frontend originally

export enum VALIDATION_MESSAGE {
    VALID = 'This variant is valid',
    NOT_VALID = 'This variant is not valid',
}

export enum VARIANT_OPERATOR {
    SNP = '>',
    INS = 'ins',
    DEL = 'del',
    DELINS = 'delins',
    DUP = 'dup',
}

export interface IVariantValidStatus {
    isValid: boolean;
    message: VALIDATION_MESSAGE;
}

export function isVariantValid(variant: string): IVariantValidStatus {
    // check if the variant is using genomic location representation
    // is using genomic location representation
    if (variant.split(',').length > 1) {
        // TODO: add check for genomic location
    }
    // is using hgvs representation
    else {
        let pattern: RegExp;
        // INVALID
        if (variant.includes('N' || '-' || 'undefined' || 'g.0')) {
            return {
                isValid: false,
                message: VALIDATION_MESSAGE.NOT_VALID,
            } as IVariantValidStatus;
        }

        // SNP
        if (variant.includes(VARIANT_OPERATOR.SNP)) {
            // chromosome(1-24,X,Y,MT) + start(number) + ref(A/T/G/C) + ">" + var(A/T/G/C)
            pattern = /^\b([1-9]|1[0-9]|2[0-4]|[XY]|(MT))\b(:g.)[0-9]*[ATGC]>[ATGC]$/i;
            if (variant.trim().match(pattern)) {
                return {
                    isValid: true,
                    message: VALIDATION_MESSAGE.VALID,
                } as IVariantValidStatus;
            }
        }

        // DELINS
        else if (variant.includes(VARIANT_OPERATOR.DELINS)) {
            // chromosome(1-24,X,Y,MT) + start(number) + "_" + end(number) + "delins" + var(ATGC)
            pattern = /^\b([1-9]|1[0-9]|2[0-4]|[XY]|(MT))\b(:g.)[0-9]*_[0-9]*(delins)[ATGC]*$/i;
            if (variant.trim().match(pattern)) {
                return {
                    isValid: true,
                    message: VALIDATION_MESSAGE.VALID,
                } as IVariantValidStatus;
            }
        }

        // INS
        else if (variant.includes(VARIANT_OPERATOR.INS)) {
            // chromosome(1-24,X,Y,MT) + start(number) + "_" + end(number) + "ins" + var(ATGC)
            pattern = /^\b([1-9]|1[0-9]|2[0-4]|[XY]|(MT))\b(:g.)[0-9]*_[0-9]*(ins)[ATGC]*$/i;
            if (variant.trim().match(pattern)) {
                return {
                    isValid: true,
                    message: VALIDATION_MESSAGE.VALID,
                } as IVariantValidStatus;
            }
        }

        // DEL
        else if (variant.includes(VARIANT_OPERATOR.DEL)) {
            pattern = /^\b([1-9]|1[0-9]|2[0-4]|[XY]|(MT))\b(:g.)[0-9]*_[0-9]*(del)$/i;
            if (variant.trim().match(pattern)) {
                return {
                    isValid: true,
                    message: VALIDATION_MESSAGE.VALID,
                } as IVariantValidStatus;
            }
        }

        // DUP
        else if (variant.includes(VARIANT_OPERATOR.DUP)) {
            pattern = /^\b([1-9]|1[0-9]|2[0-4]|[XY]|(MT))\b(:g.)[0-9]*_[0-9]*(dup)$/i;
            if (variant.trim().match(pattern)) {
                return {
                    isValid: true,
                    message: VALIDATION_MESSAGE.VALID,
                } as IVariantValidStatus;
            }
        } else {
            return {
                isValid: false,
                message: VALIDATION_MESSAGE.NOT_VALID,
            } as IVariantValidStatus;
        }
    }
    return {
        isValid: false,
        message: VALIDATION_MESSAGE.NOT_VALID,
    } as IVariantValidStatus;
}
