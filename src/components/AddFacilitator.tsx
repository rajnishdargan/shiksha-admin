import React, { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import { Typography, useMediaQuery } from "@mui/material";
import {
  GenerateSchemaAndUiSchema,
  customFields,
} from "@/components/GeneratedSchemas";
import { FormContext, FormContextType, Role } from "@/utils/app.constant";
import DynamicForm from "@/components/DynamicForm";
import SendCredentialModal from "@/components/SendCredentialModal";
import SimpleModal from "@/components/SimpleModal";
import {
  createUser,
  getFormRead,
  updateUser,
} from "@/services/CreateUserService";
import { generateUsernameAndPassword } from "@/utils/Helper";
import { FormData } from "@/utils/Interfaces";
import { RoleId } from "@/utils/app.constant";
import AreaSelection from "./AreaSelection";
import { showToastMessage } from "./Toastify";
import { transformArray } from "../utils/Helper";
import { useLocationState } from "@/utils/useLocationState";
import { tenantId } from "../../app.config";

interface AddFacilitatorModalprops {
  open: boolean;
  onClose: () => void;
  formData?: object;
  isEditModal?: boolean;
  userId?: string;
}

const AddFacilitatorModal: React.FC<AddFacilitatorModalprops> = ({
  open,
  formData,
  isEditModal = false,
  userId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [schema, setSchema] = useState<any>();
  const [openModal, setOpenModal] = useState(false);
  const [uiSchema, setUiSchema] = useState<any>();
  const [formvalue, setFormvalue] = useState<any>();


  const {
    states,
    districts,
    blocks,
    allCenters,
    isMobile,
    isMediumScreen,
    selectedState,
    selectedStateCode,
    selectedDistrict,
    selectedDistrictCode,
    selectedCenter,
    dynamicForm,
    selectedBlock,
    selectedBlockCode,
    selectedCenterCode,
    handleStateChangeWrapper,
    handleDistrictChangeWrapper,
    handleBlockChangeWrapper,
    handleCenterChangeWrapper,
    BlockFieldId, DistrctFieldId, StateFieldId
    
  } = useLocationState(open, onClose);

  useEffect(() => {
    const getAddLearnerFormData = async () => {
      try {
        const response: FormData = await getFormRead(
          FormContext.USERS,
          FormContextType.TEACHER
        );
        console.log("sortedFields", response);
        if (typeof window !== "undefined" && window.localStorage) {
          const CenterList = localStorage.getItem("CenterList");
          const centerOptions = CenterList ? JSON.parse(CenterList) : [];
          var centerOptionsList = centerOptions?.map(
            (center: { cohortId: string; cohortName: string }) => ({
              value: center.cohortId,
              label: center.cohortName,
            })
          );
          console.log(centerOptionsList);
        }
      console.log(response)
    
        if (response) {
          const newResponse={
            ...response,
            fields: response.fields.filter(field => field.name !== 'no_of_clusters')
          }
          const { schema, uiSchema, formValues } = GenerateSchemaAndUiSchema(newResponse, t);
          setFormvalue(formValues)
          setSchema(schema);
          setUiSchema(uiSchema);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };
    getAddLearnerFormData();
  }, []);

  const handleSubmit = async (
    data: IChangeEvent<any, RJSFSchema, any>,
    event: React.FormEvent<any>
  ) => {
    // setOpenModal(true);
    const target = event.target as HTMLFormElement;
   // const elementsArray = Array.from(target.elements);

    // for (const element of elementsArray) {
    //   if (
    //     (element instanceof HTMLInputElement ||
    //       element instanceof HTMLSelectElement ||
    //       element instanceof HTMLTextAreaElement) &&
    //     (element.value === "" ||
    //       (Array.isArray(element.value) && element.value.length === 0))
    //   ) {
    //     element.focus();
    //     return;
    //   }
    // }

    const formData = data.formData;
    console.log("Form data submitted:", formData);
    const schemaProperties = schema.properties;

    const { username, password } = generateUsernameAndPassword(
      selectedStateCode,
      Role.TEACHER
    );

    let apiBody: any = {
      username: username,
      password: password,
      tenantCohortRoleMapping: [
        {
          tenantId: tenantId,
          roleId: RoleId.TEACHER,
          cohortId: [selectedCenterCode],
        },
      ],
      customFields: [],
    };

    Object.entries(formData).forEach(([fieldKey, fieldValue]) => {
      const fieldSchema = schemaProperties[fieldKey];
      console.log(fieldSchema)
      const fieldId = fieldSchema?.fieldId;
      console.log(
        `FieldID: ${fieldId}, FieldValue: ${fieldValue}, type: ${typeof fieldValue}`
      );
      if (fieldId === null || fieldId === "null") {
        if (typeof fieldValue !== "object") {
          apiBody[fieldKey] = fieldValue;
        }
      } else {
        if (
          fieldSchema?.hasOwnProperty("isDropdown") ||
          fieldSchema.hasOwnProperty("isCheckbox")
        ) {
          apiBody.customFields.push({
            fieldId: fieldId,
            value: [String(fieldValue)],
          });
        } else {
          if(fieldSchema.checkbox &&fieldSchema.type==="array")
           {
            apiBody.customFields.push({
              fieldId: fieldId,
              value: String(fieldValue).split(',')
            });
           }
           else{
          apiBody.customFields.push({
            fieldId: fieldId,
            value: String(fieldValue),
          });
        }
        }
      }
    });

    if (!isEditModal) {
      apiBody.customFields.push({
        fieldId: BlockFieldId,
        value: [selectedBlockCode],
      });
      apiBody.customFields.push({
        fieldId: StateFieldId,
        value: [selectedStateCode]
      });
      apiBody.customFields.push({
        fieldId: DistrctFieldId,
        value: [selectedDistrictCode]
      });
    }
    try {
      if (isEditModal && userId) {
        console.log(userId);
        const userData = {
          name: apiBody.name,
          mobile: apiBody.mobile,
          email:apiBody.email
        };
        const customFields = apiBody.customFields;
        console.log(customFields);
        const object = {
          userData: userData,
          customFields: customFields,
        };
        const response = await updateUser(userId, object);
        showToastMessage(t("FACILITATORS.FACILITATOR_UPDATED_SUCCESSFULLY"), "success");
      } else {
        try{
          const response = await createUser(apiBody);
        showToastMessage(
          t("FACILITATORS.FACILITATOR_CREATED_SUCCESSFULLY"),
          "success"
        );
        }
     catch (error) {
      console.log(error);
    }
        
      }
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (event: IChangeEvent<any>) => {
    console.log("Form data changed:", event.formData);
  };

  const handleError = (errors: any) => {
    console.log("Form errors:", errors);
  };

  const onCloseModal = () => {
    setOpenModal(false);
    onClose();
  };

  return (
    <>
      <SimpleModal
        open={open}
        onClose={onClose}
        showFooter={false}
        modalTitle={ !isEditModal?t("FACILITATORS.NEW_FACILITATOR"): t("FACILITATORS.EDIT_FACILITATOR")}
      >
        {/* {!dynamicForm && (
          <Typography>{t("LEARNERS.FIRST_SELECT_REQUIRED_FIELDS")} </Typography>
        )} */}
        <AreaSelection
          states={transformArray(states)}
          districts={transformArray(districts)}
          blocks={transformArray(blocks)}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
          handleStateChangeWrapper={handleStateChangeWrapper}
          handleDistrictChangeWrapper={handleDistrictChangeWrapper}
          handleBlockChangeWrapper={handleBlockChangeWrapper}
          isMobile={isMobile}
          isMediumScreen={isMediumScreen}
          isCenterSelection={true}
          allCenters={allCenters}
          selectedCenter={selectedCenter}
          handleCenterChangeWrapper={handleCenterChangeWrapper}
        />

        {formData
          ? schema &&
            uiSchema && (
              <DynamicForm
                schema={schema}
                uiSchema={uiSchema}
                onSubmit={handleSubmit}
                onChange={handleChange}
                onError={handleError}
                widgets={{}}
                showErrorList={true}
                customFields={customFields}
                formData={formData}
              >
                {/* <CustomSubmitButton onClose={primaryActionHandler} /> */}
              </DynamicForm>
            )
          : dynamicForm &&
            schema &&
            uiSchema && (
              <DynamicForm
                schema={schema}
                uiSchema={uiSchema}
                onSubmit={handleSubmit}
                onChange={handleChange}
                onError={handleError}
                widgets={{}}
                showErrorList={true}
                customFields={customFields}
                formData={formvalue}
              >
                {/* <CustomSubmitButton onClose={primaryActionHandler} /> */}
              </DynamicForm>
            )}
      </SimpleModal>
      <SendCredentialModal open={openModal} onClose={onCloseModal} />
    </>
  );
};

export default AddFacilitatorModal;
