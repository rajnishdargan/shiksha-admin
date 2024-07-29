import React, { useState, useMemo, useCallback, useEffect } from "react";
import KaTableComponent from "../components/KaTableComponent";
import { DataType } from "ka-table/enums";
import HeaderComponent from "@/components/HeaderComponent";
import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "next-i18next";
import Loader from "@/components/Loader";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  getStateBlockDistrictList,
  getDistrictsForState,
  getBlocksForDistricts,
} from "@/services/MasterDataService";
import formatLabel from "@/utils/formatLabel";
import CustomModal from "@/components/CustomModal";

type StateDetail = {
  value: string;
  label: string;
};

type DistrictDetail = {
  value: string;
  label: string;
};

type BlockDetail = {
  value: string;
  label: string;
};

const Block: React.FC = () => {
  const { t } = useTranslation();
  const [selectedSort, setSelectedSort] = useState<string>("Sort");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [stateData, setStateData] = useState<StateDetail[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [districtData, setDistrictData] = useState<DistrictDetail[]>([]);
  const [blockData, setBlockData] = useState<BlockDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageOffset, setPageOffset] = useState<number>(0);
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [pageCount, setPageCount] = useState<number>(1);
  const [confirmationModalOpen, setConfirmationModalOpen] =
    useState<boolean>(false);
  const [selectedDistrictForDelete, setSelectedDistrictForDelete] =
    useState<DistrictDetail | null>(null);

  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
      try {
        const data = await getStateBlockDistrictList({ fieldName: "states" });
        setStateData(data?.result || []);
      } catch (error) {
        console.error("Error fetching states", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedState) {
        setLoading(true);
        try {
          const data = await getDistrictsForState({
            controllingfieldfk: selectedState,
            fieldName: "districts",
          });
          setDistrictData(data?.result || []);
        } catch (error) {
          console.error("Error fetching districts", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDistricts();
  }, [selectedState]);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (selectedDistrict) {
        setLoading(true);
        try {
          const data = await getBlocksForDistricts({
            controllingfieldfk: selectedDistrict,
            fieldName: "blocks",
          });
          setBlockData(data?.result || []);
        } catch (error) {
          console.error("Error fetching blocks", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBlocks();
  }, [selectedDistrict]);

  const columns = useMemo(
    () => [
      {
        key: "block",
        title: t("MASTER.BLOCK_NAMES"),
        dataType: DataType.String,
      },
      {
        key: "actions",
        title: t("MASTER.ACTIONS"),
        dataType: DataType.String,
      },
    ],
    [t]
  );

  const handleStateChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedState(event.target.value);
    setSelectedDistrict("");
  }, []);

  const handleDistrictChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setSelectedDistrict(event.target.value);
    },
    []
  );

  const handleEdit = useCallback((rowData: any) => {
  }, []);

  const handleDelete = useCallback((rowData: any) => {
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setConfirmationModalOpen(false);
  }, [selectedDistrictForDelete]);

  const handlePaginationChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPageOffset(value - 1);
  };

  useEffect(() => {
    const sortedAndPaginatedData = () => {
      if (blockData.length === 0) {
        setPageCount(1);
        return;
      }
      const sortedData = [...blockData];
      const paginatedData = sortedData.slice(
        pageOffset * pageLimit,
        (pageOffset + 1) * pageLimit
      );
      setPageCount(Math.ceil(sortedData.length / pageLimit));
    };

    sortedAndPaginatedData();
  }, [blockData, pageOffset, pageLimit]);

  const userProps = {
    selectedSort,
    selectedFilter,
    showStateDropdown: false,
    userType: t("MASTER.BLOCKS"),
    searchPlaceHolder: t("MASTER.SEARCHBAR_PLACEHOLDER_BLOCK"),
  };

  const showPagination = blockData.length > pageLimit;

  return (
    <React.Fragment>
      <CustomModal
        open={confirmationModalOpen}
        handleClose={() => setConfirmationModalOpen(false)}
        title={t("COMMON.CONFIRM_DELETE")}
        primaryBtnText={t("COMMON.DELETE")}
        secondaryBtnText={t("COMMON.CANCEL")}
        primaryBtnClick={handleConfirmDelete}
      >
        <Box>{t("COMMON.ARE_YOU_SURE_DELETE")}</Box>
      </CustomModal>

      <HeaderComponent {...userProps}>
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 5,
              marginTop: 2,
              "@media (max-width: 580px)": {
                marginTop: 10,
                flexDirection: "column",
                alignItems: "center",
              },
            }}
          >
            <Box sx={{ width: "100%" }}>
              <FormControl sx={{ width: "100%" }}>
                <InputLabel
                  sx={{ backgroundColor: "#F7F7F7", padding: "2px 8px" }}
                  id="state-select-label"
                >
                  {t("MASTER.STATE")}
                </InputLabel>
                <Select
                  labelId="state-select-label"
                  id="state-select"
                  value={selectedState}
                  onChange={handleStateChange}
                >
                  {stateData.map((stateDetail) => (
                    <MenuItem key={stateDetail.value} value={stateDetail.value}>
                      {formatLabel(stateDetail.label)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: "100%" }}>
              <FormControl sx={{ width: "100%" }}>
                <InputLabel
                  sx={{ backgroundColor: "#F7F7F7", padding: "2px 8px" }}
                  id="district-select-label"
                >
                  {t("MASTER.DISTRICTS")}
                </InputLabel>
                <Select
                  labelId="district-select-label"
                  id="district-select"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                >
                  {districtData.map((districtDetail) => (
                    <MenuItem
                      key={districtDetail.value}
                      value={districtDetail.value}
                    >
                      {formatLabel(districtDetail.label)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ marginTop: 2 }}>
            {loading ? (
              <Loader showBackdrop={true} loadingText="Loading..." />
            ) : (
              <KaTableComponent
                columns={columns}
                data={blockData.map((block) => ({
                  block: formatLabel(block.label),
                  actions: "Action buttons",
                }))}
                limit={pageLimit}
                offset={pageOffset}
                PagesSelector={() =>
                  showPagination && (
                    <Pagination
                      color="primary"
                      count={pageCount}
                      page={pageOffset + 1}
                      onChange={handlePaginationChange}
                    />
                  )
                }
                extraActions={[]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                noData={blockData.length === 0}
              />
            )}
          </Box>
        </>
      </HeaderComponent>
    </React.Fragment>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default Block;
